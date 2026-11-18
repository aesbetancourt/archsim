import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createAnthropic, type AnthropicLanguageModelOptions } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  APICallError,
  type FinishReason,
  generateText,
  type JSONSchema7,
  jsonSchema,
  type ModelMessage,
  NoObjectGeneratedError,
  Output,
  RetryError,
  type UserContent,
} from "ai";
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
const FALLBACK_MODELS = [
  "claude-fable-5-2",
  "claude-fable-5-1",
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-sonnet-5-5",
];

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
  const cwd = call.imagePath
    ? path.dirname(call.imagePath)
    : await mkdtemp(path.join(os.tmpdir(), "archsim-"));
  const prompt = call.imagePath
    ? `Read the file ${path.basename(call.imagePath)} in the current directory before you answer.\n\n${call.prompt}`
    : call.prompt;
  const model = settings.claudeCode.model || process.env.ARCHSIM_MODEL || "";
  try {
    const output = await runClaude({
      cwd,
      prompt,
      systemPrompt: call.systemPrompt,
      schema: call.schema,
      model,
    });
    return { output, model: model ? `Claude Code (${model})` : "Claude Code" };
  } finally {
    if (!call.imagePath) await rm(cwd, { recursive: true, force: true });
  }
}

async function viaOpenCode(call: ModelCall, settings: Settings): Promise<ModelResult> {
  // OpenCode reads the image from its working directory.
  const cwd = call.imagePath
    ? path.dirname(call.imagePath)
    : await mkdtemp(path.join(os.tmpdir(), "archsim-"));
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
        if (call.imagePath)
          await writeFile(path.join(cwd, "model-answer.txt"), text).catch(() => undefined);
        if (attempt === OPENCODE_TRIES) throw error;
      }
    }
  } finally {
    if (!call.imagePath) await rm(cwd, { recursive: true, force: true });
  }
}

// The user message: the diagram image, if there is one, and the prompt.
async function userMessages(call: ModelCall): Promise<ModelMessage[]> {
  const content: UserContent = [];
  if (call.imagePath) {
    content.push({ type: "file", mediaType: "image/png", data: await readFile(call.imagePath) });
  }
  content.push({ type: "text", text: call.prompt });
  return [{ role: "user", content }];
}

const outputSchema = (call: ModelCall) =>
  Output.object({ name: "result", schema: jsonSchema(call.schema as JSONSchema7) });

// Get an error for an answer that stopped before it was complete.
function finishError(finishReason: FinishReason): Error | undefined {
  if (finishReason === "content-filter") return new Error("The model declined this request.");
  if (finishReason === "length") return new Error("The answer was cut off at the token limit.");
  return undefined;
}

// The AI SDK tries some calls again. After the last try, it puts the cause in a RetryError.
const unwrap = (error: unknown) => (RetryError.isInstance(error) ? error.lastError : error);

// Change a failed structured answer into an error message that a person can read.
function noObjectError(error: unknown): Error | undefined {
  if (!NoObjectGeneratedError.isInstance(error)) return undefined;
  return (
    (error.finishReason && finishError(error.finishReason)) ??
    new Error("The model did not return valid JSON. Try again, or select a different model.")
  );
}

async function viaAnthropic(call: ModelCall, settings: Settings): Promise<ModelResult> {
  const { apiKey, model } = settings.anthropic;
  if (!apiKey) throw new Error("The Anthropic API key is not set. Open Settings.");
  const anthropic = createAnthropic({ apiKey });

  try {
    const result = await generateText({
      model: anthropic(model),
      system: call.systemPrompt,
      messages: await userMessages(call),
      output: outputSchema(call),
      maxOutputTokens: 16000,
      timeout: TIMEOUT_MS,
      providerOptions: FALLBACK_MODELS.includes(model)
        ? { anthropic: { fallbacks: "default" } satisfies AnthropicLanguageModelOptions }
        : undefined,
    });
    const stopped = finishError(result.finishReason);
    if (stopped) throw stopped;
    return { output: result.output, model: result.response.modelId };
  } catch (thrown) {
    const error = unwrap(thrown);
    const noObject = noObjectError(error);
    if (noObject) throw noObject;
    if (APICallError.isInstance(error)) {
      if (error.statusCode === 401) {
        throw new Error("Anthropic rejected the API key. Check the key in Settings.");
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Anthropic does not know the model "${model}". Check the model in Settings.`,
        );
      }
      if (error.statusCode === 429) {
        throw new Error("Anthropic rate limit reached. Wait a moment, then try again.");
      }
      throw new Error(`Anthropic API error ${error.statusCode ?? ""}: ${error.message}`);
    }
    throw error;
  }
}

// An endpoint in the OpenAI chat format.
type ChatEndpoint = {
  // The name in error messages, for example "OpenCode Go".
  label: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  headers?: Record<string, string>;
};

// One connection for each provider that has an endpoint in the OpenAI chat format.
async function viaChatCompletions(call: ModelCall, endpoint: ChatEndpoint): Promise<ModelResult> {
  const { label, baseUrl, apiKey, model, headers } = endpoint;
  const provider = createOpenAICompatible({
    name: "openaiCompatible",
    baseURL: baseUrl.replace(/\/+$/, ""),
    apiKey: apiKey || undefined,
    supportsStructuredOutputs: true,
  });
  const messages = await userMessages(call);
  // Headers on the call, not on the provider. The AI SDK replaces a user agent on the provider.
  const common = { model: provider(model), messages, headers, timeout: TIMEOUT_MS };

  try {
    try {
      const result = await generateText({
        ...common,
        system: call.systemPrompt,
        output: outputSchema(call),
        // Many providers accept a schema only in strict mode for OpenAI. Do not ask for it.
        providerOptions: { openaiCompatible: { strictJsonSchema: false } },
      });
      const stopped = finishError(result.finishReason);
      if (stopped) throw stopped;
      return { output: result.output, model: result.response.modelId || model };
    } catch (thrown) {
      // Some providers reject a JSON Schema in the request. Then put the schema in the prompt.
      const error = unwrap(thrown);
      if (!APICallError.isInstance(error) || error.statusCode !== 400) throw thrown;
    }
    const result = await generateText({
      ...common,
      system: `${call.systemPrompt}\n\nAnswer with one JSON object and no other text. It must match this JSON Schema:\n${JSON.stringify(call.schema)}`,
    });
    const stopped = finishError(result.finishReason);
    if (stopped) throw stopped;
    if (!result.text) throw new Error(`${label} returned no text.`);
    return { output: parseJson(result.text), model: result.response.modelId || model };
  } catch (thrown) {
    const error = unwrap(thrown);
    const noObject = noObjectError(error);
    if (noObject) throw noObject;
    if (APICallError.isInstance(error)) {
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw new Error(`${label} rejected the API key. Check the key in Settings.`);
      }
      const detail = (error.responseBody ?? error.message).slice(0, 300);
      throw new Error(`${label} answered ${error.statusCode ?? "with an error"}: ${detail}`);
    }
    throw error;
  }
}

async function viaOpenAICompatible(call: ModelCall, settings: Settings): Promise<ModelResult> {
  const { baseUrl, apiKey, model } = settings.openaiCompatible;
  if (!baseUrl || !model) throw new Error("The base URL and the model are not set. Open Settings.");
  return viaChatCompletions(call, { label: "The provider", baseUrl, apiKey, model });
}

// OpenCode Go translates each text model to the OpenAI chat format.
const OPENCODE_GO_URL = "https://opencode.ai/inference/go/openai/v1";

async function viaOpenCodeGo(call: ModelCall, settings: Settings): Promise<ModelResult> {
  const { apiKey, model } = settings.openCodeGo;
  if (!apiKey || !model)
    throw new Error("The OpenCode Go API key and model are not set. Open Settings.");
  return viaChatCompletions(call, {
    label: "OpenCode Go",
    baseUrl: process.env.OPENCODE_GO_BASE_URL || OPENCODE_GO_URL,
    apiKey,
    model,
    // OpenCode Go rejects a request without a session ID. Each call is one conversation.
    // It also asks each client to send its own name.
    headers: { "x-opencode-session": randomUUID(), "user-agent": "archsim/0.1" },
  });
}

// Send a prompt to the model that is selected in Settings. Return its structured answer.
export async function runModel(call: ModelCall): Promise<ModelResult> {
  const settings = await readSettings();
  if (settings.mode === "opencode") return viaOpenCode(call, settings);
  if (settings.mode === "opencode-go") return viaOpenCodeGo(call, settings);
  if (settings.mode === "anthropic") return viaAnthropic(call, settings);
  if (settings.mode === "openai-compatible") return viaOpenAICompatible(call, settings);
  return viaClaudeCode(call, settings);
}
