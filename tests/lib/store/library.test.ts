import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

let dir: string;

// Each test uses a new data folder. The library reads the folder when it loads, so load it after.
beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "charrette-library-"));
  vi.spyOn(process, "cwd").mockReturnValue(dir);
  vi.resetModules();
});

const entry = (id: string) =>
  ({
    kata: { id, title: "My problem", custom: true },
    example: { kataId: id },
    source: "text",
    createdAt: "2026-11-20T10:00:00.000Z",
  }) as unknown as import("@/lib/store/library").CustomEntry;

describe("deleteCustom", () => {
  it("deletes a problem that the user added", async () => {
    const { deleteCustom, findKata, saveCustom } = await import("@/lib/store/library");
    await saveCustom(entry("my-problem-ab12"));
    expect(await findKata("my-problem-ab12")).toBeDefined();

    expect(await deleteCustom("my-problem-ab12")).toBe(true);
    expect(await findKata("my-problem-ab12")).toBeUndefined();
  });

  it("does not delete a built-in kata, an unknown problem, or a path", async () => {
    const { deleteCustom } = await import("@/lib/store/library");
    expect(await deleteCustom("lunch-rush")).toBe(false);
    expect(await deleteCustom("my-missing")).toBe(false);
    expect(await deleteCustom("../settings")).toBe(false);
  });
});
