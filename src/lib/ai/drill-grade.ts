import { z } from "zod";
import { SCORE_MAX, SCORE_MIN, SCORES } from "@/lib/ai/score";

// An AI check of one explanation in the vocabulary drill.
// The server sends the reference definition from the glossary, so the browser cannot change it.

const verdicts = ["correct", "partly", "wrong"] as const;

const gradeOutput = z.object({
  verdict: z.enum(verdicts),
  score: z.number().int().min(SCORE_MIN).max(SCORE_MAX),
  covered: z.array(z.string()),
  missing: z.array(z.string()),
  mistakes: z.array(z.string()),
  better_answer: z.string(),
  follow_up: z.string(),
});

/** The check of one explanation: the verdict, the score, and the feedback. */
export type Grade = z.infer<typeof gradeOutput>;

/** The JSON Schema of a check. The output of the model must match it, with each provider. */
export const gradeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "score", "covered", "missing", "mistakes", "better_answer", "follow_up"],
  properties: {
    verdict: { type: "string", enum: [...verdicts] },
    // An enum works with each provider. Some reject "minimum" and "maximum".
    score: { type: "integer", enum: SCORES },
    covered: { type: "array", items: { type: "string" } },
    missing: { type: "array", items: { type: "string" } },
    mistakes: { type: "array", items: { type: "string" } },
    better_answer: { type: "string" },
    follow_up: { type: "string" },
  },
};

/**
 * Check the output of the model. A provider can return JSON that does not match the schema.
 * @param output The structured output of the model.
 * @returns The check, with the correct types.
 * @throws When the output does not match the schema of a check.
 * @example
 * const grade = parseGrade(output);
 */
export function parseGrade(output: unknown): Grade {
  const result = gradeOutput.safeParse(output);
  if (!result.success) {
    throw new Error(
      "The model did not return a valid check. Try again, or select a different model.",
    );
  }
  return result.data;
}

/**
 * The rating that the drill suggests for a verdict. The person confirms it.
 * @param grade The check of the explanation.
 * @returns True when the verdict is "correct": the person knew the term. False for the other verdicts.
 * @example
 * suggestKnew(grade); // true for a correct verdict
 */
export function suggestKnew(grade: Grade): boolean {
  return grade.verdict === "correct";
}
