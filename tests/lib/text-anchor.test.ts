import { describe, expect, it } from "vitest";
import { findPassage } from "@/lib/text-anchor";

describe("findPassage", () => {
  const page = "A cache is fast. A cache is also stale. A cache needs a rule.";

  it("keeps the saved position when the text is there", () => {
    expect(findPassage(page, "A cache", 17)).toBe(17);
  });

  it("uses the nearest occurrence when the page moved", () => {
    expect(findPassage(page, "A cache", 35)).toBe(40);
    expect(findPassage(page, "A cache", 3)).toBe(0);
  });

  it("returns -1 when the text is not on the page", () => {
    expect(findPassage(page, "a queue", 0)).toBe(-1);
    expect(findPassage(page, "", 0)).toBe(-1);
  });
});
