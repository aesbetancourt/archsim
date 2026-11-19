import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const modes = [
  "claude-code",
  "opencode",
  "opencode-go",
  "anthropic",
  "openai-compatible",
] as const;
export type Mode = (typeof modes)[number];

// The read-aloud player can use Google Cloud Text-to-Speech or the voices of the browser.
export const speechEngines = ["google", "browser"] as const;
export type SpeechEngine = (typeof speechEngines)[number];

// An empty project ID means: use the quota project of the gcloud login on this computer.
export type ReadAloud = { engine: SpeechEngine; googleProjectId: string; googleVoice: string };

// The settings file is in the data folder. Git ignores that folder.
// API keys are in plain text in this file. They must never go to the browser.
export type Settings = {
  mode: Mode;
  claudeCode: { model: string };
  openCode: { model: string };
  openCodeGo: { apiKey: string; model: string };
  anthropic: { apiKey: string; model: string };
  openaiCompatible: { baseUrl: string; apiKey: string; model: string };
  readAloud: ReadAloud;
};

const FILE = path.join(process.cwd(), "data", "settings.json");

const defaultSettings: Settings = {
  mode: "claude-code",
  claudeCode: { model: "" },
  openCode: { model: "" },
  openCodeGo: { apiKey: "", model: "kimi-k3" },
  anthropic: { apiKey: "", model: "claude-opus-5-5" },
  openaiCompatible: { baseUrl: "", apiKey: "", model: "" },
  readAloud: { engine: "browser", googleProjectId: "", googleVoice: "en-US-Chirp3-HD-Charon" },
};

export async function readSettings(): Promise<Settings> {
  try {
    const saved = JSON.parse(await readFile(FILE, "utf8")) as Partial<Settings>;
    return {
      mode: saved.mode ?? defaultSettings.mode,
      claudeCode: { ...defaultSettings.claudeCode, ...saved.claudeCode },
      openCode: { ...defaultSettings.openCode, ...saved.openCode },
      openCodeGo: { ...defaultSettings.openCodeGo, ...saved.openCodeGo },
      anthropic: { ...defaultSettings.anthropic, ...saved.anthropic },
      openaiCompatible: { ...defaultSettings.openaiCompatible, ...saved.openaiCompatible },
      readAloud: { ...defaultSettings.readAloud, ...saved.readAloud },
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
  openCodeGo: { keyHint: string; model: string };
  anthropic: { keyHint: string; model: string };
  openaiCompatible: { baseUrl: string; keyHint: string; model: string };
  readAloud: ReadAloud;
};

const hint = (key: string) => (key ? `…${key.slice(-4)}` : "");

export function toPublic(settings: Settings): PublicSettings {
  return {
    mode: settings.mode,
    claudeCode: settings.claudeCode,
    openCode: settings.openCode,
    openCodeGo: { keyHint: hint(settings.openCodeGo.apiKey), model: settings.openCodeGo.model },
    anthropic: { keyHint: hint(settings.anthropic.apiKey), model: settings.anthropic.model },
    openaiCompatible: {
      baseUrl: settings.openaiCompatible.baseUrl,
      keyHint: hint(settings.openaiCompatible.apiKey),
      model: settings.openaiCompatible.model,
    },
    readAloud: settings.readAloud,
  };
}
