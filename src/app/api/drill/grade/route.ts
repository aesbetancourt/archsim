import { buildGradePrompt, gradeSchema, gradeSystemPrompt, parseGrade } from "@/lib/drill-grade";
import { glossary } from "@/lib/glossary";
import { runModel } from "@/lib/model";
import { drillGradeRequest, readBody } from "@/lib/requests";

// Compare one explanation from the vocabulary drill with the glossary definition.
export async function POST(request: Request) {
  const body = await readBody(request, drillGradeRequest);
  if (body instanceof Response) return body;
  const term = glossary.find((entry) => entry.id === body.termId);
  if (!term) {
    return Response.json({ error: "Unknown term." }, { status: 404 });
  }

  try {
    const { output, model } = await runModel({
      prompt: buildGradePrompt(term, body.answer),
      systemPrompt: gradeSystemPrompt,
      schema: gradeSchema,
    });
    return Response.json({ grade: parseGrade(output), model });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 502 });
  }
}
