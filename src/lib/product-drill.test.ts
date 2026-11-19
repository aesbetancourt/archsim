import { describe, expect, it } from "vitest";
import { productLessons, readProductCases } from "./product-drill";
import { getWikiPage } from "./wiki";

describe("readProductCases", () => {
  it("finds the cases, with unique IDs, a known section, and a real lesson", async () => {
    const cases = await readProductCases();
    expect(cases.length).toBeGreaterThan(15);
    const ids = cases.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(cases.filter((item) => !(item.section in productLessons))).toEqual([]);
    expect(cases.every((item) => item.points.length >= 3)).toBe(true);
  });

  it("links each section to a lesson that exists", () => {
    expect(Object.values(productLessons).filter((slug) => !getWikiPage(slug))).toEqual([]);
  });
});
