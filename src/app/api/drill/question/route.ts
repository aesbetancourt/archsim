import {
  buildQuestionPrompt,
  parseGrade,
  questionGradeSystemPrompt,
  gradeSchema,
} from "@/lib/drill-grade";
import { runModel } from "@/lib/model";
import { readQuestions } from "@/lib/questions";
import { questionGradeRequest, readBody } from "@/lib/requests";

// Compare one answer from the question drill with the points of a strong answer in the lesson.
export async function POST(request: Request) {
  const body = await readBody(request, questionGradeRequest);
  if (body instanceof Response) return body;
  const question = (await readQuestions()).find((item) => item.id === body.questionId);
  if (!question) {
    return Response.json({ error: "Unknown question." }, { status: 404 });
  }

  try {
    const { output, model } = await runModel({
      prompt: buildQuestionPrompt(question, body.answer),
      systemPrompt: questionGradeSystemPrompt,
      schema: gradeSchema,
    });
    return Response.json({ grade: parseGrade(output), model });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 502 });
  }
}
