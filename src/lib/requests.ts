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

// One explanation in the vocabulary drill. The server looks up the reference by the term ID.
export const drillGradeRequest = z.object({
  termId: z.string().min(1).max(100),
  answer: z.string().trim().min(1, "Write an explanation first.").max(4_000),
});

// One answer in the question drill. The server looks up the reference by the question ID.
export const questionGradeRequest = z.object({
  questionId: z.string().min(1).max(200),
  answer: z.string().trim().min(1, "Write an answer first.").max(8_000),
});

export const boardUpdate = z.object({
  title: z.string().max(200),
  notes,
  scene: z.object({
    elements: z.array(z.unknown()).max(MAX_ELEMENTS),
    files: z.record(z.string(), z.unknown()),
  }),
});

export const highlightCreate = z.object({
  page: z.string().startsWith("/").max(500),
  title: z.string().max(500),
  // Do not trim the text here. The start position is for the text as it is.
  text: z
    .string()
    .max(5_000)
    .refine((value) => value.trim().length > 0, "Select some text first."),
  start: z.number().int().min(0),
  note: z.string().max(MAX_TEXT).default(""),
});

export const highlightUpdate = z.object({ note: z.string().max(MAX_TEXT) });

export const pageNoteUpdate = z.object({
  page: z.string().startsWith("/").max(500),
  title: z.string().max(500),
  html: notes,
});

export const progressUpdate = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(100),
  done: z.boolean(),
});

export const documentCreate = z.object({ title: z.string().max(200).default("") });

export const documentUpdate = z.object({ title: z.string().max(200), html: notes });

const httpUrl = z.url({ protocol: /^https?$/ });
const model = z.string().max(200);
const key = z.string().max(1_000);

export const settingsUpdate = z.object({
  mode: z.enum(modes),
  claudeCode: z.object({ model }),
  openCode: z.object({ model }).optional(),
  openCodeGo: z.object({ apiKey: key, model }).optional(),
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
