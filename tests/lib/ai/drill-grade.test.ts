import { describe, expect, it } from "vitest";
import { parseGrade, suggestKnew, type Grade } from "@/lib/ai/drill-grade";

const grade: Grade = {
  verdict: "partly",
  score: 2,
  covered: ["The service does not create its dependencies."],
  missing: ["The composition root."],
  mistakes: ["A factory creates objects. Dependency injection passes them in."],
  better_answer: "The service receives its compiler as a parameter.",
  follow_up: "What do you gain in tests?",
};

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
