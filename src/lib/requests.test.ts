import { describe, expect, it } from "vitest";
import {
  chatRequest,
  drillGradeRequest,
  readBody,
  reviewRequest,
  settingsUpdate,
} from "./requests";

const post = (body: string) => new Request("http://localhost/api", { method: "POST", body });

async function errorOf(response: unknown): Promise<string> {
  expect(response).toBeInstanceOf(Response);
  const result = response as Response;
  expect(result.status).toBe(400);
  return ((await result.json()) as { error: string }).error;
}

const review = {
  kataId: "sandwich-shop",
  scope: "Orders",
  characteristics: "Availability: lunch peak",
  style: "Modular monolith",
  rationale: "Small team",
  diagramPng: "data:image/png;base64,AAAA",
  elements: [
    {
      id: "a",
      type: "arrow",
      startBinding: { elementId: "b", focus: 0, gap: 1 },
      endBinding: null,
      roughness: 1,
    },
  ],
};

describe("readBody", () => {
  it("rejects a body that is not JSON", async () => {
    expect(await errorOf(await readBody(post("{"), reviewRequest))).toBe(
      "The request body is not valid JSON.",
    );
  });

  it("names the first field that is not valid", async () => {
    const body = JSON.stringify({ ...review, diagramPng: "data:image/jpeg;base64,AAAA" });
    expect(await errorOf(await readBody(post(body), reviewRequest))).toMatch(
      /^The request is not valid\. diagramPng: /,
    );
  });

  it("returns the data, keeps the extra element fields, and drops unknown top-level keys", async () => {
    const result = await readBody(post(JSON.stringify({ ...review, extra: 1 })), reviewRequest);
    expect(result).not.toBeInstanceOf(Response);
    expect(result).not.toHaveProperty("extra");
    expect((result as typeof review).elements[0].roughness).toBe(1);
  });
});

describe("request schemas", () => {
  it("rejects an element with a wrong field type", () => {
    const elements = [{ id: "t", type: "text", text: 5 }];
    expect(reviewRequest.safeParse({ ...review, elements }).success).toBe(false);
  });

  it("selects the chat context shape from its kind", () => {
    const board = { kind: "board", title: "Board", notes: "", elements: [] };
    const messages = [{ role: "user", text: "Why a queue?" }];
    expect(chatRequest.safeParse({ context: board, messages }).success).toBe(true);
    expect(chatRequest.safeParse({ context: { ...board, kind: "kata" }, messages }).success).toBe(
      false,
    );
    expect(chatRequest.safeParse({ context: board, messages: [] }).success).toBe(false);
  });

  const settings = {
    mode: "openai-compatible",
    claudeCode: { model: "" },
    anthropic: { apiKey: "", model: "" },
    openaiCompatible: { baseUrl: " https://openrouter.ai/api/v1 ", apiKey: "", model: "m" },
  };

  it("trims the base URL and accepts an empty one", () => {
    const parsed = settingsUpdate.parse(settings);
    expect(parsed.openaiCompatible.baseUrl).toBe("https://openrouter.ai/api/v1");
    const empty = { ...settings, openaiCompatible: { ...settings.openaiCompatible, baseUrl: "" } };
    expect(settingsUpdate.safeParse(empty).success).toBe(true);
  });

  it("rejects an unknown mode and a base URL that is not HTTP", () => {
    expect(settingsUpdate.safeParse({ ...settings, mode: "gpt" }).success).toBe(false);
    const file = {
      ...settings,
      openaiCompatible: { ...settings.openaiCompatible, baseUrl: "file:///etc" },
    };
    expect(settingsUpdate.safeParse(file).success).toBe(false);
  });
});

describe("drillGradeRequest", () => {
  it("accepts a term ID and an answer", () => {
    expect(drillGradeRequest.safeParse({ termId: "port", answer: "An interface." }).success).toBe(
      true,
    );
  });

  it.each([
    ["an empty answer", { termId: "port", answer: "   " }],
    ["a missing term ID", { termId: "", answer: "An interface." }],
    ["a very long answer", { termId: "port", answer: "x".repeat(4_001) }],
  ])("rejects %s", (_name, body) => {
    expect(drillGradeRequest.safeParse(body).success).toBe(false);
  });
});
