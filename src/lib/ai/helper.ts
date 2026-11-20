import type { SceneElement } from "./scene";

/** One message in the chat with the helper: from the person, or from the helper. */
export type ChatMessage = { role: "user" | "helper"; text: string };

/** What the person works on when they ask a question: a kata attempt, or a board. */
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

/** The JSON Schema of a helper answer: one reply text. The output of the model must match it. */
export const helperSchema = {
  type: "object",
  additionalProperties: false,
  required: ["reply"],
  properties: { reply: { type: "string" } },
};
