import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createAttemptDir, overallScore, saveAttempt } from "@/lib/attempts";
import { runModel } from "@/lib/model";
import type { Kata } from "@/lib/katas";
import { findKata } from "@/lib/library";
import { reviewSchema, reviewerSystemPrompt, type Review } from "@/lib/rubric";
import { describeScene, type SceneElement } from "@/lib/scene";

type Submission = {
  kataId: string;
  characteristics: string;
  style: string;
  rationale: string;
  diagramPng: string;
  elements: SceneElement[];
};

function buildPrompt(kata: Kata, submission: Submission): string {
  const list = (items: string[]) => items.map((item) => `- ${item}`).join("\n");
  return `Review this architecture kata attempt.

<kata>
Title: ${kata.title}
Context: ${[kata.context, ...(kata.details ?? [])].join("\n")}
Users: ${kata.users || "(not stated)"}
Requirements:
${list(kata.requirements) || "(not stated)"}
Constraints:
${list(kata.constraints) || "(not stated)"}
</kata>

<attempt>
<characteristics>
${submission.characteristics || "(empty)"}
</characteristics>
<style>
${submission.style || "(empty)"}
</style>
<diagram_elements>
${describeScene(submission.elements)}
</diagram_elements>
<rationale>
${submission.rationale || "(empty)"}
</rationale>
</attempt>`;
}

export async function POST(request: Request) {
  const submission = (await request.json()) as Submission;
  const kata = await findKata(submission.kataId);
  if (!kata) {
    return Response.json({ error: "Unknown kata." }, { status: 404 });
  }
  const png = submission.diagramPng?.split("base64,")[1];
  if (!png) {
    return Response.json({ error: "The diagram is missing." }, { status: 400 });
  }

  const { id, dir } = await createAttemptDir();
  await writeFile(path.join(dir, "diagram.png"), Buffer.from(png, "base64"));
  await writeFile(path.join(dir, "scene.json"), JSON.stringify(submission.elements));

  try {
    const { output, model } = await runModel({
      prompt: buildPrompt(kata, submission),
      systemPrompt: reviewerSystemPrompt,
      schema: reviewSchema,
      imagePath: path.join(dir, "diagram.png"),
    });
    const review = output as Review;
    await saveAttempt({
      id,
      kataId: kata.id,
      createdAt: new Date().toISOString(),
      characteristics: submission.characteristics,
      style: submission.style,
      rationale: submission.rationale,
      review,
      overall: overallScore(review),
      reviewer: model,
    });
    return Response.json({ id });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 502 });
  }
}
