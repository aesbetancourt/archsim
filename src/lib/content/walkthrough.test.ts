import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseWalkthrough, resolveSteps, type Walkthrough } from "./walkthrough";

const base = {
  title: "T",
  metrics: [{ id: "time", label: "Page time", unit: "ms" }],
  diagram: {
    nodes: [
      { id: "user", label: "User", col: 0, row: 0 },
      { id: "app", label: "App", col: 1, row: 0 },
      { id: "cache", label: "Cache\n(5 min)", col: 2, row: 0 },
      { id: "db", label: "Database", col: 2, row: 1 },
    ],
    edges: [
      { from: "user", to: "app" },
      { from: "app", to: "cache" },
      { from: "app", to: "db" },
    ],
  },
};

const step = (fields: object) => ({ kind: "technique", title: "S", text: "x", ...fields });

function parse(steps: object[]): Walkthrough {
  const result = parseWalkthrough(JSON.stringify({ ...base, steps }));
  if (!result.ok) throw new Error(result.error);
  return result.walkthrough;
}

describe("resolveSteps", () => {
  it("shows an arrow only when its two ends are visible and it is not hidden", () => {
    const walkthrough = parse([
      step({ show: ["user", "app"] }),
      step({ show: ["user", "app", "db", "cache"], hide: ["app>db"] }),
    ]);
    const [first, second] = resolveSteps(walkthrough);
    expect(first.edges).toEqual([0]);
    expect(second.edges).toEqual([0, 1]);
  });

  it("finds the direction of a flow", () => {
    const [resolved] = resolveSteps(
      parse([step({ show: ["user", "app", "db"], flow: ["user>app", "db>app"] })]),
    );
    expect(resolved.flows).toEqual([
      { edge: 0, reverse: false },
      { edge: 2, reverse: true },
    ]);
  });

  it("keeps metrics between steps and lists what changed", () => {
    const steps = resolveSteps(
      parse([
        step({ show: ["user", "app", "db"], metrics: { time: 450 } }),
        step({ show: ["user", "app", "db"] }),
        step({
          show: ["user", "app", "cache"],
          metrics: { time: 40 },
          down: ["cache"],
          changes: ["Reads go to the cache"],
        }),
      ]),
    );
    expect(steps[0].changes).toEqual([]);
    expect(steps[1].metrics).toEqual({ time: 450 });
    expect(steps[1].changes).toEqual([]);
    expect(steps[2].changes).toEqual([
      { sign: "+", text: "Cache (5 min)" },
      { sign: "-", text: "Database" },
      { sign: "!", text: "Cache (5 min) is down" },
      { sign: "~", text: "Page time: 450 ms → 40 ms" },
      { sign: "~", text: "Reads go to the cache" },
    ]);
  });
});

describe("parseWalkthrough", () => {
  it("names a wrong ID with its step", () => {
    const result = parseWalkthrough(
      JSON.stringify({ ...base, steps: [step({ show: ["user", "queue"], flow: ["user>db"] })] }),
    );
    expect(result).toEqual({
      ok: false,
      error: 'The walkthrough is not valid. step 1: unknown node "queue"',
    });
  });

  it("explains text that is not JSON", () => {
    const result = parseWalkthrough("{ title: ");
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/^The walkthrough is not valid JSON/);
  });

  // Each walkthrough in the lessons must be valid. Otherwise the page shows an error box.
  it("accepts every walkthrough in the lessons", async () => {
    const folder = path.join(process.cwd(), "content", "learn");
    const problems: string[] = [];
    for (const file of await readdir(folder)) {
      const markdown = await readFile(path.join(folder, file), "utf8");
      for (const match of markdown.matchAll(/^```walkthrough\n([\s\S]*?)^```$/gm)) {
        const result = parseWalkthrough(match[1]);
        if (!result.ok) problems.push(`${file}: ${result.error}`);
      }
    }
    expect(problems).toEqual([]);
  });
});
