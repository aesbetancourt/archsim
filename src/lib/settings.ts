import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type Mode = "claude-code" | "opencode" | "anthropic" | "openai-compatible";

// The settings file is in the data folder. Git ignores that folder.
// API keys are in plain text in this file. They must never go to the browser.
export type Settings = {
  mode: Mode;
  claudeCode: { model: string };
  openCode: { model: string };
  anthropic: { apiKey: string; model: string };
  openaiCompatible: { baseUrl: string; apiKey: string; model: string };
};

const FILE = path.join(process.cwd(), "data", "settings.json");

export const defaultSettings: Settings = {
  mode: "claude-code",
  claudeCode: { model: "" },
  openCode: { model: "" },
  anthropic: { apiKey: "", model: "claude-opus-5-5" },
  openaiCompatible: { baseUrl: "", apiKey: "", model: "" },
};

export async function readSettings(): Promise<Settings> {
  try {
    const saved = JSON.parse(await readFile(FILE, "utf8")) as Partial<Settings>;
    return {
      mode: saved.mode ?? defaultSettings.mode,
      claudeCode: { ...defaultSettings.claudeCode, ...saved.claudeCode },
      openCode: { ...defaultSettings.openCode, ...saved.openCode },
      anthropic: { ...defaultSettings.anthropic, ...saved.anthropic },
      openaiCompatible: { ...defaultSettings.openaiCompatible, ...saved.openaiCompatible },
    };
  } catch {
    return defaultSettings;
  }
}

export async function writeSettings(settings: Settings): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(settings, null, 2), { mode: 0o600 });
}

// The form of the settings that is safe to send to the browser.
export type PublicSettings = {
  mode: Mode;
  claudeCode: { model: string };
  openCode: { model: string };
  anthropic: { keyHint: string; model: string };
  openaiCompatible: { baseUrl: string; keyHint: string; model: string };
};

const hint = (key: string) => (key ? `…${key.slice(-4)}` : "");

export function toPublic(settings: Settings): PublicSettings {
  return {
    mode: settings.mode,
    claudeCode: settings.claudeCode,
    openCode: settings.openCode,
    anthropic: { keyHint: hint(settings.anthropic.apiKey), model: settings.anthropic.model },
    openaiCompatible: {
      baseUrl: settings.openaiCompatible.baseUrl,
      keyHint: hint(settings.openaiCompatible.apiKey),
      model: settings.openaiCompatible.model,
    },
  };
}
