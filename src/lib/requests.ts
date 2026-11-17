import { z } from "zod";
import { modes } from "./settings";

// The limits keep one request to a sensible size.
const MAX_TEXT = 20_000;
const MAX_NOTES = 500_000;
const MAX_ELEMENTS = 10_000;
// The length of the diagram as a base64 data URL. This is about 15 MB of PNG.
const MAX_PNG = 20_000_000;

const text = z.string().max(MAX_TEXT);
const notes = z.string().max(MAX_NOTES);

// The part of an Excalidraw element that the server reads. Other fields are kept as they are.
const binding = z.looseObject({ elementId: z.string() }).nullish();
const sceneElement = z.looseObject({
  id: z.string(),
  type: z.string(),
  text: z.string().optional(),
  containerId: z.string().nullish(),
  startBinding: binding,
  endBinding: binding,
  customData: z
    .looseObject({ decor: z.boolean().optional(), boundary: z.boolean().optional() })
    .nullish(),
  strokeStyle: z.string().optional(),
  groupIds: z.array(z.string()).optional(),
});
const elements = z.array(sceneElement).max(MAX_ELEMENTS);

export const reviewRequest = z.object({
  kataId: z.string().min(1).max(200),
  scope: text,
  notes: notes.optional(),
  characteristics: text,
  style: text,
  rationale: text,
  diagramPng: z.string().max(MAX_PNG).startsWith("data:image/png;base64,"),
  elements,
});
export type ReviewRequest = z.infer<typeof reviewRequest>;

export const chatRequest = z.object({
  context: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("kata"),
      kataId: z.string().min(1).max(200),
      scope: text,
      notes,
      characteristics: text,
      style: text,
      rationale: text,
      elements,
    }),
    z.object({ kind: z.literal("board"), title: text, notes, elements }),
  ]),
  messages: z
    .array(z.object({ role: z.enum(["user", "helper"]), text }))
    .min(1)
    .max(200),
});

export const solveRequest = z.object({ text: z.string().max(100_000) });

export const boardUpdate = z.object({
  title: z.string().max(200),
  notes,
  scene: z.object({
    elements: z.array(z.unknown()).max(MAX_ELEMENTS),
    files: z.record(z.string(), z.unknown()),
  }),
});

const httpUrl = z.url({ protocol: /^https?$/ });
const model = z.string().max(200);
const key = z.string().max(1_000);

export const settingsUpdate = z.object({
  mode: z.enum(modes),
  claudeCode: z.object({ model }),
  openCode: z.object({ model }).optional(),
  anthropic: z.object({ apiKey: key, model }),
  openaiCompatible: z.object({
    baseUrl: z
      .string()
      .trim()
      .pipe(z.union([z.literal(""), httpUrl])),
    apiKey: key,
    model,
  }),
});

// Read the JSON body of a request and check it against a schema.
// If the body is not valid, return a 400 response that names the first problem.
export async function readBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T> | Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The request body is not valid JSON." }, { status: 400 });
  }
  const result = schema.safeParse(body);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const where = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
  return Response.json(
    { error: `The request is not valid. ${where}${issue.message}` },
    { status: 400 },
  );
}
