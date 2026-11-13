import { readSettings, toPublic, writeSettings, type Mode, type Settings } from "@/lib/settings";

const modes: Mode[] = ["claude-code", "opencode", "anthropic", "openai-compatible"];

type Update = {
  mode: Mode;
  claudeCode: { model: string };
  openCode?: { model: string };
  anthropic: { apiKey: string; model: string };
  openaiCompatible: { baseUrl: string; apiKey: string; model: string };
};

export async function GET() {
  return Response.json(toPublic(await readSettings()));
}

export async function PUT(request: Request) {
  const update = (await request.json()) as Update;
  if (!modes.includes(update.mode)) {
    return Response.json({ error: "Unknown mode." }, { status: 400 });
  }
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
