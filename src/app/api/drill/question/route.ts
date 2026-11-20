import { gradeSchema, parseGrade } from "@/lib/ai/drill-grade";
import { runModel } from "@/lib/ai/model";
import { readQuestions } from "@/lib/content/questions";
import { questionGradeRequest, readBody } from "@/lib/requests";
import {
  behavioralGradeSystemPrompt,
  buildQuestionPrompt,
  questionGradeSystemPrompt,
} from "@/prompts/drill";
import { HTTP } from "@/lib/http-status";

/**
 * Compare one answer from the question drill with the points of a strong answer in the lesson.
 * @param request The request. Its body has the question ID and the answer.
 * @returns The `grade` and the `model` that gave it. 400 when the body is not valid, 404 when
 * the question is not known, 502 when the model fails.
 */
export async function POST(request: Request) {
  const body = await readBody(request, questionGradeRequest);
  if (body instanceof Response) return body;
  const question = (await readQuestions()).find((item) => item.id === body.questionId);
  if (!question) {
    return Response.json({ error: "Unknown question." }, { status: HTTP.notFound });
  }

  try {
    const { output, model } = await runModel({
      prompt: buildQuestionPrompt(question, body.answer),
      // A behavioral question is graded as a story, not as a design answer.
      systemPrompt:
        question.slug === "behavioral-interviews"
          ? behavioralGradeSystemPrompt
          : questionGradeSystemPrompt,
      schema: gradeSchema,
    });
    return Response.json({ grade: parseGrade(output), model });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: HTTP.badGateway });
  }
}
