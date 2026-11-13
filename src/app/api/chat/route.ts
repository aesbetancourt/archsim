import { helperPrompt, helperSchema, helperSystemPrompt, type ChatMessage, type HelperContext } from "@/lib/helper";
import { findKata } from "@/lib/library";
import { runModel } from "@/lib/model";

// The chat sends only the last messages. Older ones are dropped.
const MAX_MESSAGES = 12;

export async function POST(request: Request) {
  const { context, messages } = (await request.json()) as { context: HelperContext; messages: ChatMessage[] };
  if (!messages?.length || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "There is no question to answer." }, { status: 400 });
  }
  const kata = context.kind === "kata" ? await findKata(context.kataId) : undefined;
  if (context.kind === "kata" && !kata) {
    return Response.json({ error: "Unknown kata." }, { status: 404 });
  }

  try {
    const { output } = await runModel({
      prompt: helperPrompt(context, kata, messages.slice(-MAX_MESSAGES)),
      systemPrompt: helperSystemPrompt(context.kind),
      schema: helperSchema,
    });
    return Response.json({ reply: (output as { reply: string }).reply });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 502 });
  }
}
