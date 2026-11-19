import { describe, expect, it } from "vitest";
import { splitSentences } from "./sentences";

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
