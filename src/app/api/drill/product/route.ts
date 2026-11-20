import { gradeSchema, parseGrade } from "@/lib/drill-grade";
import { runModel } from "@/lib/model";
import { readProductCases } from "@/lib/product-drill";
import { questionGradeRequest, readBody } from "@/lib/requests";
import { buildQuestionPrompt, productGradeSystemPrompt } from "@/prompts/drill";

// Compare one answer from the product drill with the points of a strong answer.
export async function POST(request: Request) {
  const body = await readBody(request, questionGradeRequest);
  if (body instanceof Response) return body;
  const item = (await readProductCases()).find((entry) => entry.id === body.questionId);
  if (!item) {
    return Response.json({ error: "Unknown case." }, { status: 404 });
  }

  try {
    const { output, model } = await runModel({
      prompt: buildQuestionPrompt({ ...item, lesson: item.section }, body.answer),
      systemPrompt: productGradeSystemPrompt,
      schema: gradeSchema,
    });
    return Response.json({ grade: parseGrade(output), model });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 502 });
  }
}
