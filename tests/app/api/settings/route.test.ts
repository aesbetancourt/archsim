import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "charrette-settings-route-"));
  vi.spyOn(process, "cwd").mockReturnValue(dir);
  vi.resetModules();
});

const KEY = "sk-ant-SECRET-2222-bbbb";

// The body that the Settings form sends.
const body = (anthropicKey: string) => ({
  mode: "anthropic",
  claudeCode: { model: "" },
  openCode: { model: "" },
  openCodeGo: { apiKey: "", model: "kimi-k3" },
  anthropic: { apiKey: anthropicKey, model: "claude-opus-5-5" },
  openaiCompatible: { baseUrl: "", apiKey: "", model: "" },
});
const put = (data: unknown) =>
  new Request("http://localhost/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
const saved = async () =>
  JSON.parse(await readFile(path.join(dir, "data", "settings.json"), "utf8"));

describe("the settings route", () => {
  it("saves a key, and sends back only its hint", async () => {
    const { GET, PUT } = await import("@/app/api/settings/route");
    const response = await PUT(put(body(KEY)));
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain("SECRET");

    expect((await saved()).anthropic.apiKey).toBe(KEY);
    const shown = await (await GET()).text();
    expect(shown).not.toContain("SECRET");
    expect(JSON.parse(shown).anthropic.keyHint).toBe("…bbbb");
  });

  it("keeps the saved key when the key field is empty", async () => {
    const { PUT } = await import("@/app/api/settings/route");
    await PUT(put(body(KEY)));
    await PUT(put(body("")));
    expect((await saved()).anthropic.apiKey).toBe(KEY);
  });

  it("refuses a body in the wrong form, and saves nothing", async () => {
    const { PUT } = await import("@/app/api/settings/route");
    const response = await PUT(put({ mode: "not-a-mode" }));
    expect(response.status).toBe(400);
    await expect(saved()).rejects.toThrow();
  });
});
