import { describe, expect, it } from "vitest";
import {
  buildGradePrompt,
  buildQuestionPrompt,
  parseGrade,
  suggestKnew,
  type Grade,
} from "./drill-grade";
import type { GlossaryTerm } from "./glossary";

const term: GlossaryTerm = {
  id: "dependency-injection",
  term: "Dependency injection",
  category: "Application design",
  definition: "A part receives the parts it needs from outside.",
  example: "createRenderService({ compiler }) receives a compiler.",
  match: [],
};

const grade: Grade = {
  verdict: "partly",
  score: 2,
  covered: ["The service does not create its dependencies."],
  missing: ["The composition root."],
  mistakes: ["A factory creates objects. Dependency injection passes them in."],
  better_answer: "The service receives its compiler as a parameter.",
  follow_up: "What do you gain in tests?",
};

describe("buildGradePrompt", () => {
  it("contains the term, the reference, and the trimmed answer", () => {
    const prompt = buildGradePrompt(term, "  It is like a factory.  ");
    expect(prompt).toContain("Name: Dependency injection");
    expect(prompt).toContain("Definition: A part receives the parts it needs from outside.");
    expect(prompt).toContain("<answer>\nIt is like a factory.\n</answer>");
  });
});

describe("parseGrade", () => {
  it("accepts an output that matches the schema", () => {
    expect(parseGrade(grade)).toEqual(grade);
  });

  it.each([
    ["an unknown verdict", { ...grade, verdict: "maybe" }],
    ["a score out of range", { ...grade, score: 6 }],
    ["a missing field", { ...grade, follow_up: undefined }],
    ["no object", "correct"],
  ])("rejects %s", (_name, output) => {
    expect(() => parseGrade(output)).toThrow("The model did not return a valid check.");
  });
});

describe("suggestKnew", () => {
  it("suggests 'I knew it' only for a correct answer", () => {
    expect(suggestKnew({ ...grade, verdict: "correct" })).toBe(true);
    expect(suggestKnew({ ...grade, verdict: "partly" })).toBe(false);
    expect(suggestKnew({ ...grade, verdict: "wrong" })).toBe(false);
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
