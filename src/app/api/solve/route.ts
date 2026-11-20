import { runModel } from "@/lib/ai/model";
import type { WorkedExample } from "@/lib/content/examples";
import type { Kata } from "@/lib/content/katas";
import { saveCustom } from "@/lib/store/library";
import { readBody, solveRequest } from "@/lib/requests";
import { cleanDiagram, solutionSchema } from "@/lib/ai/solver";
import { buildSolvePrompt, solverSystemPrompt } from "@/prompts/solve";
import { HTTP } from "@/lib/http-status";
import { randomText } from "@/lib/random-id";
import { MIN_PROBLEM_LENGTH } from "@/lib/limits";

// The random part of the ID of a problem that the user adds.
const PROBLEM_ID_RANDOM_LENGTH = 4;

type Solution = { kata: Omit<Kata, "id">; example: Omit<WorkedExample, "kataId"> };

export async function POST(request: Request) {
  const body = await readBody(request, solveRequest);
  if (body instanceof Response) return body;
  const problem = body.text.trim();
  if (problem.length < MIN_PROBLEM_LENGTH) {
    return Response.json({ error: "The problem text is too short." }, { status: HTTP.badRequest });
  }

  try {
    const { output, model } = await runModel({
      prompt: buildSolvePrompt(problem),
      systemPrompt: solverSystemPrompt,
      schema: solutionSchema,
    });
    const solution = output as Solution;

    const slug = solution.kata.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const id = `my-${slug || "problem"}-${randomText(PROBLEM_ID_RANDOM_LENGTH)}`;
    await saveCustom({
      kata: { ...solution.kata, id, custom: true },
      example: {
        ...solution.example,
        kataId: id,
        author: model,
        diagram: cleanDiagram(solution.example.diagram),
      },
      source: problem,
      createdAt: new Date().toISOString(),
    });
    return Response.json({ id });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: HTTP.badGateway });
  }
}
