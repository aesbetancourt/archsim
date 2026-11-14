import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { runClaude } from "./claude";
import { runOpenCode } from "./opencode";
import { readSettings, type Settings } from "./settings";

type ModelCall = {
  prompt: string;
  systemPrompt: string;
  schema: object;
  // Path of a PNG image that the model must look at.
  imagePath?: string;
};

export type ModelResult = { output: unknown; model: string };

const TIMEOUT_MS = 5 * 60 * 1000;

// These models decline some requests. The API can then continue on a different model.
const FALLBACK_MODELS = ["claude-fable-5-2", "claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"];

// The number of times to ask OpenCode when the answer is not valid JSON.
const OPENCODE_TRIES = 2;

// Get JSON from a model answer. Some models put it in a code block.
function parseJson(text: string): unknown {
  // Keep the part from the first "{" to the last "}". This drops a code block mark and extra words.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  try {
    return JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text);
  } catch {
    throw new Error("The model did not return valid JSON. Try again, or select a different model.");
  }
}

async function viaClaudeCode(call: ModelCall, settings: Settings): Promise<ModelResult> {
  // Claude Code reads the image from its working directory.
  const cwd = call.imagePath ? path.dirname(call.imagePath) : await mkdtemp(path.join(os.tmpdir(), "archsim-"));
  const prompt = call.imagePath
    ? `Read the file ${path.basename(call.imagePath)} in the current directory before you answer.\n\n${call.prompt}`
    : call.prompt;
  const model = settings.claudeCode.model || process.env.ARCHSIM_MODEL || "";
  try {
    const output = await runClaude({ cwd, prompt, systemPrompt: call.systemPrompt, schema: call.schema, model });
    return { output, model: model ? `Claude Code (${model})` : "Claude Code" };
  } finally {
    if (!call.imagePath) await rm(cwd, { recursive: true, force: true });
  }
}

async function viaOpenCode(call: ModelCall, settings: Settings): Promise<ModelResult> {
  // OpenCode reads the image from its working directory.
  const cwd = call.imagePath ? path.dirname(call.imagePath) : await mkdtemp(path.join(os.tmpdir(), "archsim-"));
  const model = settings.openCode.model;
  try {
    // OpenCode cannot force the answer to match the schema. A model sometimes writes JSON
    // that is not valid, for example with a quote mark that is not escaped. Ask one more time.
    for (let attempt = 1; ; attempt++) {
      const text = await runOpenCode({
        cwd,
        prompt: call.prompt,
        systemPrompt: call.systemPrompt,
        schema: call.schema,
        model,
        imageName: call.imagePath ? path.basename(call.imagePath) : undefined,
      });
      try {
        return { output: parseJson(text), model: model ? `OpenCode (${model})` : "OpenCode" };
      } catch (error) {
        // Keep the answer next to the attempt, so the cause can be found.
        if (call.imagePath) await writeFile(path.join(cwd, "model-answer.txt"), text).catch(() => undefined);
        if (attempt === OPENCODE_TRIES) throw error;
      }
    }
  } finally {
    if (!call.imagePath) await rm(cwd, { recursive: true, force: true });
  }
}

async function viaAnthropic(call: ModelCall, settings: Settings): Promise<ModelResult> {
  const { apiKey, model } = settings.anthropic;
  if (!apiKey) throw new Error("The Anthropic API key is not set. Open Settings.");
  const client = new Anthropic({ apiKey, timeout: TIMEOUT_MS });

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (call.imagePath) {
    const data = (await readFile(call.imagePath)).toString("base64");
    content.push({ type: "image", source: { type: "base64", media_type: "image/png", data } });
  }
  content.push({ type: "text", text: call.prompt });

  const useFallback = FALLBACK_MODELS.includes(model);
  try {
    const response = await client.beta.messages.create({
      model,
      max_tokens: 16000,
      system: call.systemPrompt,
      messages: [{ role: "user", content }],
      output_config: { format: { type: "json_schema", schema: call.schema as Record<string, unknown> } },
      ...(useFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    });
    if (response.stop_reason === "refusal") {
      throw new Error("The model declined this request.");
    }
    if (response.stop_reason === "max_tokens") {
      throw new Error("The answer was cut off at the token limit.");
    }
    const text = response.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
    return { output: parseJson(text), model: response.model };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new Error("Anthropic rejected the API key. Check the key in Settings.");
    }
    if (error instanceof Anthropic.NotFoundError) {
      throw new Error(`Anthropic does not know the model "${model}". Check the model in Settings.`);
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new Error("Anthropic rate limit reached. Wait a moment, then try again.");
    }
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Anthropic API error ${error.status ?? ""}: ${error.message}`);
    }
    throw error;
  }
}

// One connection for each provider that has an endpoint in the OpenAI chat format.
async function viaOpenAICompatible(call: ModelCall, settings: Settings): Promise<ModelResult> {
  const { baseUrl, apiKey, model } = settings.openaiCompatible;
  if (!baseUrl || !model) throw new Error("The base URL and the model are not set. Open Settings.");

  const content: object[] = [{ type: "text", text: call.prompt }];
  if (call.imagePath) {
    const data = (await readFile(call.imagePath)).toString("base64");
    content.push({ type: "image_url", image_url: { url: `data:image/png;base64,${data}` } });
  }

  const send = (withSchema: boolean) =>
    fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: withSchema
              ? call.systemPrompt
              : `${call.systemPrompt}\n\nAnswer with one JSON object and no other text. It must match this JSON Schema:\n${JSON.stringify(call.schema)}`,
          },
          { role: "user", content },
        ],
        ...(withSchema
          ? { response_format: { type: "json_schema", json_schema: { name: "result", schema: call.schema } } }
          : {}),
      }),
    });

  // Some providers reject a JSON Schema in the request. Then put the schema in the prompt.
  let response = await send(true);
  if (response.status === 400) response = await send(false);
  if (response.status === 401 || response.status === 403) {
    throw new Error("The provider rejected the API key. Check the key in Settings.");
  }
  if (!response.ok) {
    throw new Error(`The provider answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const body = await response.json();
  const text = body.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("The provider returned no text.");
  return { output: parseJson(text), model: body.model ?? model };
}

// Send a prompt to the model that is selected in Settings. Return its structured answer.
export async function runModel(call: ModelCall): Promise<ModelResult> {
  const settings = await readSettings();
  if (settings.mode === "opencode") return viaOpenCode(call, settings);
  if (settings.mode === "anthropic") return viaAnthropic(call, settings);
  if (settings.mode === "openai-compatible") return viaOpenAICompatible(call, settings);
  return viaClaudeCode(call, settings);
}
