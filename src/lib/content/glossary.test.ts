import { describe, expect, it } from "vitest";
import { glossary, glossaryCategories } from "./glossary";
import { getWikiPage } from "./wiki";

describe("glossary", () => {
  it("has unique IDs and terms", () => {
    const ids = glossary.map((entry) => entry.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
    const terms = glossary.map((entry) => entry.term.toLowerCase());
    expect(terms.filter((term, index) => terms.indexOf(term) !== index)).toEqual([]);
  });

  it("uses only known categories and lessons, and lowercase match words", () => {
    const problems = glossary.flatMap((entry) => [
      ...(glossaryCategories.includes(entry.category)
        ? []
        : [`${entry.id}: category ${entry.category}`]),
      ...(entry.learn && !getWikiPage(entry.learn)
        ? [`${entry.id}: no lesson ${entry.learn}`]
        : []),
      ...entry.match
        .filter((word) => word !== word.toLowerCase())
        .map((word) => `${entry.id}: ${word}`),
    ]);
    expect(problems).toEqual([]);
  });
});
