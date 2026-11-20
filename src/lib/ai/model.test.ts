import { mkdtemp, writeFile } from "node:fs/promises";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runModel } from "./model";
import { readSettings, type Settings } from "@/lib/store/settings";

vi.mock("@/lib/store/settings", () => ({ readSettings: vi.fn() }));

// The fields of a provider request that the tests read.
type Part = { type: string; image_url?: { url: string } };
type RequestBody = {
  fallbacks?: string;
  max_tokens?: number;
  output_config?: { format: unknown };
  response_format?: unknown;
  messages: { content: string | Part[] }[];
};
type Recorded = { url: string; headers: http.IncomingHttpHeaders; body: RequestBody };

const partsOf = (body: RequestBody, index: number) => body.messages[index].content as Part[];
type Reply = { status: number; body: unknown };

// A local server in place of the provider. Each test sets the reply.
let reply: (request: Recorded) => Reply;
const requests: Recorded[] = [];
let server: http.Server;
let baseUrl: string;
let imagePath: string;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["ok"],
  properties: { ok: { type: "boolean" } },
};

function anthropicMessage(text: string | null, stopReason = "end_turn"): Reply {
  return {
    status: 200,
    body: {
      id: "msg_1",
      type: "message",
      role: "assistant",
      model: "claude-served",
      content: text === null ? [] : [{ type: "text", text }],
      stop_reason: stopReason,
      stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 1 },
    },
  };
}

function chatCompletion(content: string, finishReason = "stop"): Reply {
  return {
    status: 200,
    body: {
      id: "c1",
      object: "chat.completion",
      created: 1,
      model: "served-model",
      choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: finishReason }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    },
  };
}

const error = (status: number): Reply => ({
  status,
  body: { error: { type: "error", message: `status ${status}` } },
});

function useSettings(mode: Settings["mode"], anthropicModel = "claude-opus-5-5") {
  vi.mocked(readSettings).mockResolvedValue({
    mode,
    claudeCode: { model: "" },
    openCode: { model: "" },
    openCodeGo: { apiKey: "go-key", model: "kimi-k3" },
    anthropic: { apiKey: "sk-test", model: anthropicModel },
    openaiCompatible: { baseUrl: `${baseUrl}/v1/`, apiKey: "key", model: "my-model" },
    vertex: { projectId: "", location: "global", model: "gemini-3.8-flash" },
    readAloud: { engine: "browser", googleProjectId: "", googleVoice: "en-US-Chirp3-HD-Charon" },
  });
}

const call = (withImage = false) =>
  runModel({
    prompt: "PROMPT",
    systemPrompt: "SYSTEM",
    schema,
    imagePath: withImage ? imagePath : undefined,
  });

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const recorded = { url: req.url ?? "", headers: req.headers, body: JSON.parse(raw) };
      requests.push(recorded);
      const { status, body } = reply(recorded);
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  vi.stubEnv("ANTHROPIC_BASE_URL", `${baseUrl}/v1`);
  vi.stubEnv("OPENCODE_GO_BASE_URL", `${baseUrl}/go/v1`);

  const dir = await mkdtemp(path.join(os.tmpdir(), "charrette-test-"));
  imagePath = path.join(dir, "diagram.png");
  await writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
});

afterAll(() => {
  server.close();
  vi.unstubAllEnvs();
});

beforeEach(() => {
  requests.length = 0;
});

describe("Anthropic API connection", () => {
  it("sends the schema, the image, and the fallback option, and returns the JSON", async () => {
    useSettings("anthropic");
    reply = () => anthropicMessage('{"ok":true}');

    await expect(call(true)).resolves.toEqual({ output: { ok: true }, model: "claude-served" });

    const { url, headers, body } = requests[0];
    expect(url).toBe("/v1/messages");
    expect(headers["x-api-key"]).toBe("sk-test");
    expect(headers["anthropic-beta"]).toContain("server-side-fallback");
    expect(body.fallbacks).toBe("default");
    expect(body.max_tokens).toBe(16000);
    expect(body.output_config?.format).toEqual({ type: "json_schema", schema });
    expect(partsOf(body, 0).map((part) => part.type)).toEqual(["image", "text"]);
  });

  it("does not ask for a fallback for other models", async () => {
    useSettings("anthropic", "claude-haiku-5-5");
    reply = () => anthropicMessage('{"ok":true}');

    await call();

    expect(requests[0].body.fallbacks).toBeUndefined();
    expect(requests[0].headers["anthropic-beta"] ?? "").not.toContain("server-side-fallback");
  });

  it.each([
    [401, "Anthropic rejected the API key. Check the key in Settings."],
    [404, 'Anthropic does not know the model "claude-opus-5-5". Check the model in Settings.'],
  ])("explains status %i", async (status, message) => {
    useSettings("anthropic");
    reply = () => error(status);

    await expect(call()).rejects.toThrow(message);
  });

  it("explains a refusal", async () => {
    useSettings("anthropic");
    reply = () => anthropicMessage(null, "refusal");

    await expect(call()).rejects.toThrow("The model declined this request.");
  });

  it("explains an answer that is cut off", async () => {
    useSettings("anthropic");
    reply = () => anthropicMessage('{"ok":', "max_tokens");

    await expect(call()).rejects.toThrow("The answer was cut off at the token limit.");
  });

  it("requires an API key", async () => {
    useSettings("anthropic");
    vi.mocked(readSettings).mockResolvedValue({
      ...(await readSettings()),
      anthropic: { apiKey: "", model: "claude-opus-5-5" },
    });

    await expect(call()).rejects.toThrow("The Anthropic API key is not set. Open Settings.");
    expect(requests).toHaveLength(0);
  });
});

describe("OpenAI-compatible connection", () => {
  it("sends a JSON Schema that is not strict, and the image as a data URL", async () => {
    useSettings("openai-compatible");
    reply = () => chatCompletion('{"ok":true}');

    await expect(call(true)).resolves.toEqual({ output: { ok: true }, model: "served-model" });

    const { url, headers, body } = requests[0];
    expect(url).toBe("/v1/chat/completions");
    expect(headers.authorization).toBe("Bearer key");
    expect(body.response_format).toEqual({
      type: "json_schema",
      json_schema: { name: "result", schema, strict: false },
    });
    const image = partsOf(body, 1).find((part) => part.type === "image_url");
    expect(image?.image_url?.url).toMatch(/^data:image\/png;base64,/);
  });

  it("puts the schema in the prompt when the provider rejects it", async () => {
    useSettings("openai-compatible");
    reply = ({ body }) =>
      body.response_format ? error(400) : chatCompletion('Here:\n```json\n{"ok":true}\n```');

    await expect(call()).resolves.toEqual({ output: { ok: true }, model: "served-model" });

    expect(requests).toHaveLength(2);
    expect(requests[1].body.response_format).toBeUndefined();
    expect(requests[1].body.messages[0].content).toContain("It must match this JSON Schema");
  });

  it("explains a rejected key", async () => {
    useSettings("openai-compatible");
    reply = () => error(403);

    await expect(call()).rejects.toThrow(
      "The provider rejected the API key. Check the key in Settings.",
    );
  });

  it("shows the provider answer for other errors", async () => {
    useSettings("openai-compatible");
    reply = () => error(422);

    await expect(call()).rejects.toThrow(/^The provider answered 422: .*status 422/);
  });

  it("explains an answer that is not JSON", async () => {
    useSettings("openai-compatible");
    reply = () => chatCompletion("I cannot do that.");

    await expect(call()).rejects.toThrow("The model did not return valid JSON.");
  });
});

describe("OpenCode Go connection", () => {
  it("sends the key, a session ID, and the app name", async () => {
    useSettings("opencode-go");
    reply = () => chatCompletion('{"ok":true}');

    await expect(call()).resolves.toEqual({ output: { ok: true }, model: "served-model" });

    const { url, headers, body } = requests[0];
    expect(url).toBe("/go/v1/chat/completions");
    expect(headers.authorization).toBe("Bearer go-key");
    expect(headers["x-opencode-session"]).toMatch(/^[0-9a-f-]{36}$/);
    expect(headers["user-agent"]).toMatch(/^charrette\//);
    expect((body as RequestBody & { model: string }).model).toBe("kimi-k3");
  });

  it("names OpenCode Go when it rejects the key", async () => {
    useSettings("opencode-go");
    reply = () => error(401);

    await expect(call()).rejects.toThrow(
      "OpenCode Go rejected the API key. Check the key in Settings.",
    );
  });

  it("requires an API key", async () => {
    useSettings("opencode-go");
    vi.mocked(readSettings).mockResolvedValue({
      ...(await readSettings()),
      openCodeGo: { apiKey: "", model: "kimi-k3" },
    });

    await expect(call()).rejects.toThrow("The OpenCode Go API key and model are not set.");
    expect(requests).toHaveLength(0);
  });
});
