import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

let dir: string;

// Each test uses a new data folder. The settings module reads the folder when it loads.
beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "charrette-settings-"));
  vi.spyOn(process, "cwd").mockReturnValue(dir);
  vi.resetModules();
});

const load = () => import("./settings");
const file = () => path.join(dir, "data", "settings.json");

// Keys that are easy to find in a text, if one of them leaks.
const KEYS = {
  go: "go-SECRET-0000-1111-aaaa",
  anthropic: "sk-ant-SECRET-2222-bbbb",
  openai: "sk-SECRET-3333-cccc",
};

describe("readSettings", () => {
  it("returns the defaults when there is no file", async () => {
    const { readSettings } = await load();
    const settings = await readSettings();
    expect(settings.mode).toBe("claude-code");
    expect(settings.anthropic.apiKey).toBe("");
    expect(settings.readAloud.engine).toBe("browser");
  });

  it("returns the defaults when the file is damaged", async () => {
    await mkdir(path.dirname(file()), { recursive: true });
    await writeFile(file(), "{ not json");
    const { readSettings } = await load();
    expect((await readSettings()).mode).toBe("claude-code");
  });

  it("fills the parts that an older file does not have", async () => {
    await mkdir(path.dirname(file()), { recursive: true });
    await writeFile(
      file(),
      JSON.stringify({ mode: "anthropic", anthropic: { apiKey: KEYS.anthropic } }),
    );
    const { readSettings } = await load();
    const settings = await readSettings();
    expect(settings.mode).toBe("anthropic");
    // The saved key stays, and the model of the same part comes from the defaults.
    expect(settings.anthropic).toEqual({ apiKey: KEYS.anthropic, model: "claude-opus-5-5" });
    expect(settings.vertex.location).toBe("global");
    expect(settings.readAloud.googleVoice).toBe("en-US-Chirp3-HD-Charon");
  });
});

describe("writeSettings", () => {
  it("saves a file that only the owner can read, because it holds API keys", async () => {
    const { readSettings, writeSettings } = await load();
    const settings = await readSettings();
    await writeSettings({ ...settings, anthropic: { apiKey: KEYS.anthropic, model: "m" } });

    expect((await stat(file())).mode & 0o777).toBe(0o600);
    expect(JSON.parse(await readFile(file(), "utf8")).anthropic.apiKey).toBe(KEYS.anthropic);
    expect((await readSettings()).anthropic.apiKey).toBe(KEYS.anthropic);
  });
});

describe("toPublic", () => {
  it("never has an API key, only the last four characters of each", async () => {
    const { readSettings, toPublic } = await load();
    const settings = await readSettings();
    const shown = toPublic({
      ...settings,
      openCodeGo: { apiKey: KEYS.go, model: "a" },
      anthropic: { apiKey: KEYS.anthropic, model: "b" },
      openaiCompatible: { baseUrl: "http://localhost:11434/v1", apiKey: KEYS.openai, model: "c" },
    });

    const sent = JSON.stringify(shown);
    for (const key of Object.values(KEYS)) expect(sent).not.toContain(key);
    expect(sent).not.toContain("SECRET");
    expect(sent).not.toContain("apiKey");
    expect(shown.anthropic.keyHint).toBe("…bbbb");
    expect(shown.openaiCompatible.baseUrl).toBe("http://localhost:11434/v1");
  });

  it("shows no hint when no key is saved", async () => {
    const { readSettings, toPublic } = await load();
    expect(toPublic(await readSettings()).anthropic.keyHint).toBe("");
  });

  it("does not show a short key, because four characters are then most of it", async () => {
    const { readSettings, toPublic } = await load();
    const settings = await readSettings();
    const shown = toPublic({ ...settings, anthropic: { apiKey: "abcd", model: "m" } });
    expect(JSON.stringify(shown)).not.toContain("abcd");
    // The form still learns that a key is saved.
    expect(shown.anthropic.keyHint).toBe("…");
  });
});
