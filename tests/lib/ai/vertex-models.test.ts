import { describe, expect, it } from "vitest";
import { textModels } from "@/lib/ai/vertex-models";

describe("textModels", () => {
  it("keeps the Gemini text models, newest first, and drops the other kinds", () => {
    const names = [
      "gemini-2.5-pro",
      "gemini-3.8-flash",
      "gemini-3.8-flash-tts",
      "gemini-4-neon",
      "gemini-embedding-2",
      "gemini-3.1-flash-image",
      "gemini-live-2.5-flash-native-audio",
      "gemini-3.5-transcribe",
      "imagen-4",
      "gemini-10-flash",
    ];
    expect(textModels(names)).toEqual([
      "gemini-10-flash",
      "gemini-4-neon",
      "gemini-3.8-flash",
      "gemini-2.5-pro",
    ]);
  });
});
