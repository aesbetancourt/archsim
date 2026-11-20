import { diagramShapes } from "@/lib/content/diagram-shapes";
import type { DiagramSpec } from "@/lib/content/examples";
import { object, text, textList } from "./json-schema";
import { styleLessons } from "@/lib/content/kata-method";

/**
 * The JSON Schema of a solution: a kata and its worked example.
 * The output of the solver must match it, with each provider.
 */
export const solutionSchema = object({
  kata: object(
    {
      title: text,
      difficulty: { type: "string", enum: ["starter", "medium", "hard"] },
      context: text,
      users: text,
      requirements: textList,
      constraints: textList,
    },
    ["users"],
  ),
  example: object(
    {
      hardParts: { type: "array", items: object({ quote: text, meaning: text }) },
      assumptions: textList,
      characteristics: { type: "array", items: object({ name: text, why: text }) },
      style: object({
        name: { type: "string", enum: styleLessons.map((lesson) => lesson.name) },
        why: text,
        rejected: { type: "array", items: object({ name: text, why: text }) },
      }),
      diagram: object({
        nodes: {
          type: "array",
          items: object(
            {
              id: text,
              label: text,
              col: { type: "number" },
              row: { type: "number" },
              external: { type: "boolean" },
              shape: { type: "string", enum: diagramShapes },
            },
            ["external", "shape"],
          ),
        },
        edges: {
          type: "array",
          items: object(
            {
              from: text,
              to: text,
              label: text,
              async: { type: "boolean" },
              both: { type: "boolean" },
            },
            ["label", "async", "both"],
          ),
        },
      }),
      walkthrough: textList,
      tradeoffs: textList,
      risks: textList,
      operations: textList,
      reviewQuestions: textList,
      alternative: object({ title: text, body: text }),
    },
    ["assumptions", "operations"],
  ),
});

/**
 * Remove diagram parts that the renderer cannot draw.
 * It removes a node with an ID that is used two times, and an edge with a missing end or the same two ends.
 * @param diagram The diagram from the model.
 * @returns A diagram that the renderer can draw.
 * @example
 * const diagram = cleanDiagram(solution.example.diagram);
 */
export function cleanDiagram(diagram: DiagramSpec): DiagramSpec {
  const ids = new Set<string>();
  const nodes = diagram.nodes.filter((node) => {
    if (ids.has(node.id)) return false;
    ids.add(node.id);
    return true;
  });
  const edges = diagram.edges.filter(
    (edge) => ids.has(edge.from) && ids.has(edge.to) && edge.from !== edge.to,
  );
  return { nodes, edges };
}
