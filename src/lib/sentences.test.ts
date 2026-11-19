import { describe, expect, it } from "vitest";
import { splitSentences, withoutAsides } from "./sentences";

const parts = (text: string, max?: number) =>
  splitSentences(text, max).map(({ start, end }) => text.slice(start, end));

describe("splitSentences", () => {
  it("splits sentences and removes the spaces around them", () => {
    expect(parts("  A cache is fast. It can be stale!  Is that fine? ")).toEqual([
      "A cache is fast.",
      "It can be stale!",
      "Is that fine?",
    ]);
  });

  it("keeps a heading without a full stop as one part", () => {
    expect(parts("Trade-offs")).toEqual(["Trade-offs"]);
  });

  it("drops parts with no letter or digit", () => {
    expect(parts("— ")).toEqual([]);
  });

  it("cuts a long sentence at a space", () => {
    expect(parts("one two three four", 9)).toEqual(["one two", "three", "four"]);
  });
});

describe("withoutAsides", () => {
  it("removes the text in parentheses", () => {
    expect(withoutAsides("A cache (for example Redis) is fast.")).toBe("A cache is fast.");
  });

  it("removes nested parentheses and an aside at the start", () => {
    expect(withoutAsides("(See (also) caching.) Read on.")).toBe("Read on.");
  });

  it("keeps notation where the parenthesis follows a letter", () => {
    expect(withoutAsides("A lookup is O(log n), and h(key) is a hash.")).toBe(
      "A lookup is O(log n), and h(key) is a hash.",
    );
  });

  it("keeps a parenthesis that is not closed", () => {
    expect(withoutAsides("Step 1) starts (here")).toBe("Step 1) starts (here");
  });
});
