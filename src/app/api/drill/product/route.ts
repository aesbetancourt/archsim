import { gradeSchema, parseGrade } from "@/lib/ai/drill-grade";
import { runModel } from "@/lib/ai/model";
import { readProductCases } from "@/lib/content/product-drill";
import { questionGradeRequest, readBody } from "@/lib/requests";
import { buildQuestionPrompt, productGradeSystemPrompt } from "@/prompts/drill";
import { HTTP } from "@/lib/http-status";

/**
 * Compare one answer from the product drill with the points of a strong answer.
 * @param request The request. Its body has the case ID and the answer.
 * @returns The `grade` and the `model` that gave it. 400 when the body is not valid, 404 when
 * the case is not known, 502 when the model fails.
 */
export async function POST(request: Request) {
  const body = await readBody(request, questionGradeRequest);
  if (body instanceof Response) return body;
  const item = (await readProductCases()).find((entry) => entry.id === body.questionId);
  if (!item) {
    return Response.json({ error: "Unknown case." }, { status: HTTP.notFound });
  }

  try {
    const { output, model } = await runModel({
      prompt: buildQuestionPrompt({ ...item, lesson: item.section }, body.answer),
      systemPrompt: productGradeSystemPrompt,
      schema: gradeSchema,
    });
    return Response.json({ grade: parseGrade(output), model });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: HTTP.badGateway });
  }
}
