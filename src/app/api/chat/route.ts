import { helperSchema } from "@/lib/ai/helper";
import { findKata } from "@/lib/store/library";
import { runModel } from "@/lib/ai/model";
import { chatRequest, readBody } from "@/lib/requests";
import { buildHelperPrompt, helperSystemPrompt } from "@/prompts/helper";
import { HTTP } from "@/lib/http-status";

// The chat sends only the last messages. Older ones are dropped.
const MAX_MESSAGES = 12;

/**
 * Answer the last question of the helper chat, for a kata or for a lesson.
 * @param request The request. Its body has the context and the messages of the chat.
 * @returns The `reply` of the model. 400 when the body is not valid or the last message is
 * not from the user, 404 when the kata is not known, 502 when the model fails.
 */
export async function POST(request: Request) {
  const body = await readBody(request, chatRequest);
  if (body instanceof Response) return body;
  const { context, messages } = body;
  if (messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "There is no question to answer." }, { status: HTTP.badRequest });
  }
  const kata = context.kind === "kata" ? await findKata(context.kataId) : undefined;
  if (context.kind === "kata" && !kata) {
    return Response.json({ error: "Unknown kata." }, { status: HTTP.notFound });
  }

  try {
    const { output } = await runModel({
      prompt: buildHelperPrompt(context, kata, messages.slice(-MAX_MESSAGES)),
      systemPrompt: helperSystemPrompt(context.kind),
      schema: helperSchema,
    });
    return Response.json({ reply: (output as { reply: string }).reply });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: HTTP.badGateway });
  }
}
