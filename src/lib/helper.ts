import type { SceneElement } from "./scene";

export type ChatMessage = { role: "user" | "helper"; text: string };

// What the person works on when they ask a question.
export type HelperContext =
  | {
      kind: "kata";
      kataId: string;
      scope: string;
      notes: string;
      characteristics: string;
      style: string;
      rationale: string;
      elements: SceneElement[];
    }
  | { kind: "board"; title: string; notes: string; elements: SceneElement[] };

export const helperSchema = {
  type: "object",
  additionalProperties: false,
  required: ["reply"],
  properties: { reply: { type: "string" } },
};
