import { readBody, settingsUpdate } from "@/lib/requests";
import { readSettings, toPublic, writeSettings, type Settings } from "@/lib/settings";

export async function GET() {
  return Response.json(toPublic(await readSettings()));
}

export async function PUT(request: Request) {
  const update = await readBody(request, settingsUpdate);
  if (update instanceof Response) return update;
  const current = await readSettings();
  // An empty key field means: keep the saved key.
  const next: Settings = {
    mode: update.mode,
    claudeCode: { model: update.claudeCode.model.trim() },
    openCode: { model: update.openCode?.model.trim() ?? current.openCode.model },
    anthropic: {
      apiKey: update.anthropic.apiKey.trim() || current.anthropic.apiKey,
      model: update.anthropic.model.trim() || current.anthropic.model,
    },
    openaiCompatible: {
      baseUrl: update.openaiCompatible.baseUrl.trim(),
      apiKey: update.openaiCompatible.apiKey.trim() || current.openaiCompatible.apiKey,
      model: update.openaiCompatible.model.trim(),
    },
  };
  await writeSettings(next);
  return Response.json(toPublic(next));
}
