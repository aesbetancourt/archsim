import { describe, expect, it } from "vitest";
import type { GlossaryTerm } from "@/lib/content/glossary";
import { buildGradePrompt, buildQuestionPrompt } from "./drill";

const term: GlossaryTerm = {
  id: "dependency-injection",
  term: "Dependency injection",
  category: "Application design",
  definition: "A part receives the parts it needs from outside.",
  example: "createRenderService({ compiler }) receives a compiler.",
  match: [],
};

describe("buildGradePrompt", () => {
  it("contains the term, the reference, and the trimmed answer", () => {
    const prompt = buildGradePrompt(term, "  It is like a factory.  ");
    expect(prompt).toContain("Name: Dependency injection");
    expect(prompt).toContain("Definition: A part receives the parts it needs from outside.");
    expect(prompt).toContain("<answer>\nIt is like a factory.\n</answer>");
  });
});

describe("buildQuestionPrompt", () => {
  it("contains the question, each point of the reference, and the trimmed answer", () => {
    const prompt = buildQuestionPrompt(
      {
        question: "Why a cache?",
        lesson: "Caching",
        points: ["Reads repeat.", "Old data is acceptable."],
      },
      "  Because reads repeat.  ",
    );
    expect(prompt).toContain("Why a cache?\nTopic: Caching");
    expect(prompt).toContain("- Reads repeat.\n- Old data is acceptable.");
    expect(prompt).toContain("<answer>\nBecause reads repeat.\n</answer>");
  });
});
