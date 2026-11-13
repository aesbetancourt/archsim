import { runModel } from "@/lib/model";

// Send a very small request with the saved settings.
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
    return Response.json({ ok, model }, { status: ok ? 200 : 502 });
  } catch (error) {
    return Response.json({ ok: false, error: (error as Error).message }, { status: 502 });
  }
}
