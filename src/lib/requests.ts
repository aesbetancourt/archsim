import { z } from "zod";
import { modes, speechEngines } from "@/lib/store/settings";
import { HTTP } from "@/lib/http-status";

// The limits keep one request to a sensible size. Each limit is a number of characters, except
// where the comment says otherwise.
const MAX_TEXT = 20_000;
const MAX_NOTES = 500_000;
// The number of canvas elements in one drawing.
const MAX_ELEMENTS = 10_000;
// The length of the diagram as a base64 data URL. This is about 15 MB of PNG.
const MAX_PNG = 20_000_000;
// An ID, a name, a title, or a model name.
const MAX_NAME = 200;
// A short ID or label from the content, such as a lesson slug, a term ID, or a competency.
const MAX_SLUG = 100;
// A page address, the title of a page, or a heading.
const MAX_PAGE_FIELD = 500;
// The number of messages in one help chat.
const MAX_MESSAGES = 200;
// The text of a problem for "Solve a problem".
const MAX_PROBLEM = 100_000;
// An explanation in the vocabulary drill, and an answer in the question drill.
const MAX_EXPLANATION = 4_000;
const MAX_ANSWER = 8_000;
// A highlighted passage.
const MAX_PASSAGE = 5_000;
// One part of a story, and the number of competencies of a story.
const MAX_STORY_PART = 6_000;
const MAX_COMPETENCIES = 20;
// An API key.
const MAX_KEY = 1_000;
// One sentence for the read-aloud player. Google accepts at most 5,000 bytes in one request.
const MAX_SENTENCE = 1_000;

const text = z.string().max(MAX_TEXT);
const notes = z.string().max(MAX_NOTES);
const name = z.string().max(MAX_NAME);
const id = z.string().min(1).max(MAX_NAME);
const slugId = z.string().min(1).max(MAX_SLUG);
const pageField = z.string().max(MAX_PAGE_FIELD);
const pageAddress = z.string().startsWith("/").max(MAX_PAGE_FIELD);

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
  kataId: id,
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
      kataId: id,
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
    .max(MAX_MESSAGES),
});

export const solveRequest = z.object({ text: z.string().max(MAX_PROBLEM) });

// One explanation in the vocabulary drill. The server looks up the reference by the term ID.
export const drillGradeRequest = z.object({
  termId: slugId,
  answer: z.string().trim().min(1, "Write an explanation first.").max(MAX_EXPLANATION),
});

// One answer in the question drill. The server looks up the reference by the question ID.
export const questionGradeRequest = z.object({
  questionId: id,
  answer: z.string().trim().min(1, "Write an answer first.").max(MAX_ANSWER),
});

export const boardUpdate = z.object({
  title: name,
  notes,
  scene: z.object({
    elements: z.array(z.unknown()).max(MAX_ELEMENTS),
    files: z.record(z.string(), z.unknown()),
  }),
});

export const highlightCreate = z.object({
  page: pageAddress,
  title: pageField,
  // Do not trim the text here. The start position is for the text as it is.
  text: z
    .string()
    .max(MAX_PASSAGE)
    .refine((value) => value.trim().length > 0, "Select some text first."),
  start: z.number().int().min(0),
  note: z.string().max(MAX_TEXT).default(""),
});

export const highlightUpdate = z.object({ note: z.string().max(MAX_TEXT) });

export const bookmarkCreate = z.object({
  page: pageAddress,
  title: pageField,
  heading: pageField,
  anchor: z
    .string()
    .regex(/^[a-z0-9-]*$/)
    .max(MAX_NAME),
});

export const pageNoteUpdate = z.object({
  page: pageAddress,
  title: pageField,
  html: notes,
});

export const progressUpdate = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(MAX_SLUG),
  done: z.boolean(),
});

const storyText = z.string().max(MAX_STORY_PART);
export const storyFields = z.object({
  title: name,
  situation: storyText,
  task: storyText,
  action: storyText,
  result: storyText,
  reflection: storyText,
  competencies: z.array(z.string().max(MAX_SLUG)).max(MAX_COMPETENCIES),
});

export const documentCreate = z.object({ title: name.default("") });

export const documentUpdate = z.object({ title: name, html: notes });

const httpUrl = z.url({ protocol: /^https?$/ });
// An empty project ID means: use a default project. See the settings file.
const googleProjectId = z
  .string()
  .trim()
  .regex(/^([a-z][a-z0-9-]{4,28}[a-z0-9])?$/, "This is not a Google Cloud project ID.");
const model = name;
const key = z.string().max(MAX_KEY);

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
  vertex: z
    .object({
      projectId: googleProjectId,
      location: z
        .string()
        .trim()
        .regex(/^[a-z][a-z0-9-]{1,30}$/, "This is not a Google Cloud location."),
      model,
    })
    .optional(),
  readAloud: z
    .object({
      engine: z.enum(speechEngines),
      googleProjectId,
      googleVoice: z
        .string()
        .trim()
        .regex(/^[a-z]{2,3}-[A-Z]{2}-[A-Za-z0-9-]{1,80}$/, "This is not a Google voice name."),
    })
    .optional(),
});

// The project and the location for the list of Vertex AI models. An empty project means: use the
// project in Settings.
export const vertexModelsQuery = z.object({
  project: googleProjectId.default(""),
  location: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9-]{1,30}$/, "This is not a Google Cloud location.")
    .default("global"),
});

// One sentence for the read-aloud player.
export const speechRequest = z.object({ text: z.string().trim().min(1).max(MAX_SENTENCE) });

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
    return Response.json(
      { error: "The request body is not valid JSON." },
      { status: HTTP.badRequest },
    );
  }
  const result = schema.safeParse(body);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const where = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
  return Response.json(
    { error: `The request is not valid. ${where}${issue.message}` },
    { status: HTTP.badRequest },
  );
}
