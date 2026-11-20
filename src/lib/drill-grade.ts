import { z } from "zod";

// An AI check of one explanation in the vocabulary drill.
// The server sends the reference definition from the glossary, so the browser cannot change it.

const verdicts = ["correct", "partly", "wrong"] as const;

const gradeOutput = z.object({
  verdict: z.enum(verdicts),
  score: z.number().int().min(1).max(5),
  covered: z.array(z.string()),
  missing: z.array(z.string()),
  mistakes: z.array(z.string()),
  better_answer: z.string(),
  follow_up: z.string(),
});

export type Grade = z.infer<typeof gradeOutput>;

// The output of the model must match this schema, with each provider.
export const gradeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "score", "covered", "missing", "mistakes", "better_answer", "follow_up"],
  properties: {
    verdict: { type: "string", enum: [...verdicts] },
    // An enum works with each provider. Some reject "minimum" and "maximum".
    score: { type: "integer", enum: [1, 2, 3, 4, 5] },
    covered: { type: "array", items: { type: "string" } },
    missing: { type: "array", items: { type: "string" } },
    mistakes: { type: "array", items: { type: "string" } },
    better_answer: { type: "string" },
    follow_up: { type: "string" },
  },
};

// Check the output of the model. A provider can return JSON that does not match the schema.
export function parseGrade(output: unknown): Grade {
  const result = gradeOutput.safeParse(output);
  if (!result.success) {
    throw new Error(
      "The model did not return a valid check. Try again, or select a different model.",
    );
  }
  return result.data;
}

// The rating that the drill suggests for a verdict. The person confirms it.
export function suggestKnew(grade: Grade): boolean {
  return grade.verdict === "correct";
}
