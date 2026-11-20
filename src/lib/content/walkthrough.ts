import { z } from "zod";
import { diagramShapes } from "./diagram-shapes";

// A walkthrough is a lesson in steps. One diagram stays on the screen. Each step shows a part of
// it, moves packets along some arrows, and changes the numbers above it. A lesson puts a
// walkthrough in a code block with the language "walkthrough".

const stepKinds = ["problem", "idea", "technique", "failure", "recap"] as const;
/** The kind of a walkthrough step: a problem, an idea, a technique, a failure, or a recap. */
export type StepKind = (typeof stepKinds)[number];

const ids = z.array(z.string()).default([]);

/** The schema of the diagram of a walkthrough: its nodes, groups, and arrows. */
export const diagramSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      col: z.number(),
      row: z.number(),
      external: z.boolean().optional(),
      shape: z.enum(diagramShapes).optional(),
    }),
  ),
  groups: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        col: z.number(),
        row: z.number(),
        cols: z.number(),
        rows: z.number(),
      }),
    )
    .optional(),
  edges: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      label: z.string().optional(),
      async: z.boolean().optional(),
      both: z.boolean().optional(),
    }),
  ),
});

const stepSchema = z.object({
  kind: z.enum(stepKinds),
  title: z.string(),
  // Paragraphs, with an empty line between them.
  text: z.string(),
  key: z.string().optional(),
  // The nodes and groups that are visible. An arrow is visible when its two ends are visible.
  show: ids,
  // Arrows to hide although their ends are visible, as "from>to".
  hide: ids,
  // Arrows that carry moving packets, as "a>b": the packets go from a to b.
  flow: ids,
  // Nodes to mark, and nodes that failed.
  focus: ids,
  down: ids,
  // A short note above a node, by node ID.
  notes: z.record(z.string(), z.string()).default({}),
  // New values of the metrics, by metric ID. A metric keeps its value until a step changes it.
  metrics: z.record(z.string(), z.union([z.number(), z.string()])).default({}),
  // More lines for the list of changes. The list also gets the changes that are computed.
  changes: z.array(z.string()).default([]),
});

const walkthroughSchema = z
  .object({
    title: z.string(),
    metrics: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          unit: z.string().default(""),
          // Which direction is good, for the color of a change.
          better: z.enum(["lower", "higher"]).optional(),
        }),
      )
      .default([]),
    diagram: diagramSchema,
    steps: z.array(stepSchema).min(1),
  })
  .superRefine((value, context) => {
    // Find a wrong ID while the lesson is written, not when a reader opens the step.
    const known = new Set([
      ...value.diagram.nodes.map((node) => node.id),
      ...(value.diagram.groups ?? []).map((group) => group.id),
    ]);
    const edges = new Set(value.diagram.edges.map((edge) => `${edge.from}>${edge.to}`));
    const metrics = new Set(value.metrics.map((metric) => metric.id));
    value.steps.forEach((step, index) => {
      const where = `step ${index + 1}`;
      const fail = (message: string) =>
        context.addIssue({ code: "custom", message: `${where}: ${message}` });
      for (const id of [...step.show, ...step.focus, ...step.down, ...Object.keys(step.notes)])
        if (!known.has(id)) fail(`unknown node "${id}"`);
      for (const key of [...step.hide, ...step.flow]) {
        const [a, b] = key.split(">");
        if (!edges.has(`${a}>${b}`) && !edges.has(`${b}>${a}`)) fail(`no arrow "${key}"`);
      }
      for (const id of Object.keys(step.metrics))
        if (!metrics.has(id)) fail(`unknown metric "${id}"`);
    });
  });

/** A walkthrough after the schema checked it. */
export type Walkthrough = z.infer<typeof walkthroughSchema>;

/**
 * One line of the change list of a step.
 * The sign is "+" for a part that shows, "-" for a part that goes, "!" for a part that is down,
 * and "~" for other changes.
 */
export type Change = { sign: "+" | "-" | "~" | "!"; text: string };

type Flow = { edge: number; reverse: boolean };

/** The state of the diagram and the numbers in one step, ready to draw. */
export type ResolvedStep = {
  visible: string[];
  edges: number[];
  flows: Flow[];
  focus: string[];
  down: string[];
  notes: Record<string, string>;
  metrics: Record<string, number | string>;
  changes: Change[];
};

const label = (walkthrough: Walkthrough, id: string) =>
  (
    walkthrough.diagram.nodes.find((node) => node.id === id)?.label ??
    walkthrough.diagram.groups?.find((group) => group.id === id)?.label ??
    id
  ).replace(/\n/g, " ");

/**
 * Make the text of a metric value, with its unit.
 * @param value The value. A number gets thousands separators.
 * @param unit The unit, or an empty string for no unit.
 * @returns The text of the value, or "—" when there is no value.
 * @example
 * formatMetric(12000, "req/s"); // "12,000 req/s"
 * formatMetric(undefined, "ms"); // "—"
 */
export function formatMetric(value: number | string | undefined, unit: string): string {
  if (value === undefined) return "—";
  const text = typeof value === "number" ? value.toLocaleString("en-US") : value;
  return unit ? `${text} ${unit}` : text;
}

/**
 * Compute the state of each step. The list of changes compares a step with the step before it.
 * @param walkthrough The walkthrough, after the schema checked it.
 * @returns The state of each step, in order.
 * @example
 * const steps = resolveSteps(walkthrough);
 * steps[1].changes; // what changed after the first step
 */
export function resolveSteps(walkthrough: Walkthrough): ResolvedStep[] {
  const { diagram } = walkthrough;
  const resolved: ResolvedStep[] = [];
  let metrics: Record<string, number | string> = {};
  let before = new Set<string>();
  let downBefore = new Set<string>();

  walkthrough.steps.forEach((step, index) => {
    const visible = new Set(step.show);
    const hidden = new Set(step.hide);
    const edges = diagram.edges.flatMap((edge, position) =>
      visible.has(edge.from) && visible.has(edge.to) && !hidden.has(`${edge.from}>${edge.to}`)
        ? [position]
        : [],
    );
    const flows = step.flow.flatMap((key): Flow[] => {
      const [a, b] = key.split(">");
      const forward = diagram.edges.findIndex((edge) => edge.from === a && edge.to === b);
      if (forward !== -1) return [{ edge: forward, reverse: false }];
      const backward = diagram.edges.findIndex((edge) => edge.from === b && edge.to === a);
      return backward === -1 ? [] : [{ edge: backward, reverse: true }];
    });

    const next = { ...metrics, ...step.metrics };
    const changes: Change[] = [];
    // The first step has nothing to compare with.
    if (index > 0) {
      for (const id of step.show)
        if (!before.has(id)) changes.push({ sign: "+", text: label(walkthrough, id) });
      for (const id of before)
        if (!visible.has(id)) changes.push({ sign: "-", text: label(walkthrough, id) });
      for (const id of step.down)
        if (!downBefore.has(id))
          changes.push({ sign: "!", text: `${label(walkthrough, id)} is down` });
      for (const metric of walkthrough.metrics) {
        if (metrics[metric.id] === next[metric.id] || next[metric.id] === undefined) continue;
        changes.push({
          sign: "~",
          text: `${metric.label}: ${formatMetric(metrics[metric.id], metric.unit)} → ${formatMetric(next[metric.id], metric.unit)}`,
        });
      }
    }
    for (const text of step.changes) changes.push({ sign: "~", text });

    resolved.push({
      visible: step.show,
      edges,
      flows,
      focus: step.focus,
      down: step.down,
      notes: step.notes,
      metrics: next,
      changes,
    });
    metrics = next;
    before = visible;
    downBefore = new Set(step.down);
  });
  return resolved;
}

/**
 * Read the text of a walkthrough code block. Return a message that names the problem if it is
 * not valid, so the author sees it on the page.
 * @param source The JSON text of the code block.
 * @returns The walkthrough, or an error message when the text is not valid.
 * @example
 * const result = parseWalkthrough(code);
 * if (!result.ok) console.error(result.error);
 */
export function parseWalkthrough(
  source: string,
): { ok: true; walkthrough: Walkthrough } | { ok: false; error: string } {
  let json: unknown;
  try {
    json = JSON.parse(source);
  } catch (error) {
    return { ok: false, error: `The walkthrough is not valid JSON: ${(error as Error).message}` };
  }
  const result = walkthroughSchema.safeParse(json);
  if (result.success) return { ok: true, walkthrough: result.data };
  const issue = result.error.issues[0];
  const where = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
  return { ok: false, error: `The walkthrough is not valid. ${where}${issue.message}` };
}
