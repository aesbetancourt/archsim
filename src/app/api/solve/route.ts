import { runModel } from "@/lib/model";
import type { WorkedExample } from "@/lib/examples";
import type { Kata } from "@/lib/katas";
import { saveCustom } from "@/lib/library";
import { readBody, solveRequest } from "@/lib/requests";
import { cleanDiagram, solutionSchema } from "@/lib/solver";
import { buildSolvePrompt, solverSystemPrompt } from "@/prompts/solve";

type Solution = { kata: Omit<Kata, "id">; example: Omit<WorkedExample, "kataId"> };

export async function POST(request: Request) {
  const body = await readBody(request, solveRequest);
  if (body instanceof Response) return body;
  const problem = body.text.trim();
  if (problem.length < 40) {
    return Response.json({ error: "The problem text is too short." }, { status: 400 });
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
    const id = `my-${slug || "problem"}-${Math.random().toString(36).slice(2, 6)}`;
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
    return Response.json({ error: (error as Error).message }, { status: 502 });
  }
}
