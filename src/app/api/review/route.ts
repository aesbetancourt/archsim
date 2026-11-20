import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createAttemptDir, overallScore, saveAttempt } from "@/lib/store/attempts";
import { runModel } from "@/lib/ai/model";
import { findKata } from "@/lib/store/library";
import { reviewSchema, type Review } from "@/lib/ai/rubric";
import { readBody, reviewRequest } from "@/lib/requests";
import { buildReviewPrompt, reviewerSystemPrompt } from "@/prompts/review";
import { HTTP } from "@/lib/http-status";

export async function POST(request: Request) {
  const submission = await readBody(request, reviewRequest);
  if (submission instanceof Response) return submission;
  const kata = await findKata(submission.kataId);
  if (!kata) {
    return Response.json({ error: "Unknown kata." }, { status: HTTP.notFound });
  }
  const png = submission.diagramPng.split("base64,")[1];
  if (!png) {
    return Response.json({ error: "The diagram is missing." }, { status: HTTP.badRequest });
  }

  const { id, dir } = await createAttemptDir();
  await writeFile(path.join(dir, "diagram.png"), Buffer.from(png, "base64"));
  await writeFile(path.join(dir, "scene.json"), JSON.stringify(submission.elements));

  try {
    const { output, model } = await runModel({
      prompt: buildReviewPrompt(kata, submission),
      systemPrompt: reviewerSystemPrompt,
      schema: reviewSchema,
      imagePath: path.join(dir, "diagram.png"),
    });
    const review = output as Review;
    await saveAttempt({
      id,
      kataId: kata.id,
      createdAt: new Date().toISOString(),
      scope: submission.scope,
      notes: submission.notes,
      characteristics: submission.characteristics,
      style: submission.style,
      rationale: submission.rationale,
      review,
      overall: overallScore(review),
      reviewer: model,
    });
    return Response.json({ id });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: HTTP.badGateway });
  }
}
