import { describe, expect, it } from "vitest";
import { search } from "./search";
import { buildSearchIndex } from "./search-index";

describe("buildSearchIndex", () => {
  it("has each kind of item, and links that start with a slash", async () => {
    const items = await buildSearchIndex();
    const kinds = new Set(items.map((item) => item.kind));
    for (const kind of [
      "Page",
      "Lesson",
      "Section",
      "Case",
      "Kata",
      "Term",
      "Question",
      "Cheatsheet",
    ])
      expect(kinds).toContain(kind);
    expect(items.filter((item) => !item.href.startsWith("/"))).toEqual([]);
  });

  it("finds a lesson by its title first", async () => {
    const [first] = search(await buildSearchIndex(), "caching");
    expect(first.href).toBe("/learn/caching");
  });
});
