import { runModel } from "@/lib/ai/model";
import { HTTP } from "@/lib/http-status";

/**
 * Send a very small request with the saved settings, to test the connection to the model.
 * @returns `ok` and the `model` that answered. 502 when the model fails or gives a wrong
 * answer.
 */
export async function POST() {
  try {
    const { output, model } = await runModel({
      prompt: 'Set "ok" to true.',
      systemPrompt: "You are a connection test. Answer with the requested JSON only.",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["ok"],
        properties: { ok: { type: "boolean" } },
      },
    });
    const ok = (output as { ok?: boolean }).ok === true;
    return Response.json({ ok, model }, { status: ok ? HTTP.ok : HTTP.badGateway });
  } catch (error) {
    return Response.json(
      { ok: false, error: (error as Error).message },
      { status: HTTP.badGateway },
    );
  }
}
