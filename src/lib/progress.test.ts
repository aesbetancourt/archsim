import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readProgress, setLessonDone } from "./progress";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "archsim-progress-"));
  vi.spyOn(process, "cwd").mockReturnValue(dir);
});

describe("progress", () => {
  it("starts with no lesson done", async () => {
    expect(await readProgress()).toEqual({ done: {} });
  });

  it("marks a lesson as done and not done again", async () => {
    await setLessonDone("caching", true);
    await setLessonDone("hexagonal", true);
    expect(Object.keys((await readProgress()).done)).toEqual(["caching", "hexagonal"]);

    await setLessonDone("caching", false);
    const saved = JSON.parse(await readFile(path.join(dir, "data", "progress.json"), "utf8"));
    expect(Object.keys(saved.done)).toEqual(["hexagonal"]);
  });

  it("keeps all marks when they arrive at the same time", async () => {
    await Promise.all(["a", "b", "c", "d"].map((slug) => setLessonDone(slug, true)));
    expect(Object.keys((await readProgress()).done).sort()).toEqual(["a", "b", "c", "d"]);
  });
});
