import type { Grade } from "@/lib/ai/drill-grade";
import type { ChatMessage, HelperContext } from "@/lib/ai/helper";
import type { ReviewRequest } from "@/lib/requests";
import type { Highlight } from "@/lib/store/notebook";
import type { PublicSettings, Settings } from "@/lib/store/settings";
import type { Story, StoryFields } from "@/lib/store/stories";

// The requests from the browser to the server of the app.
// A component calls a function of this file. It does not call fetch.
// When the data comes from a different place, for example in a desktop app, change this file only.

// A request that the server refused, or an answer that is not JSON.
// The message is the reason that the server gave. It is empty when the server gave none, for
// example after a crash. Then the caller shows its own text.
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// keepalive lets a save finish when the person leaves the page.
type Options = { body?: unknown; keepalive?: boolean };

async function send(method: string, url: string, options: Options = {}): Promise<Response> {
  const hasBody = options.body !== undefined;
  const response = await fetch(url, {
    method,
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    keepalive: options.keepalive,
  });
  if (response.ok) return response;
  // The server gives the reason in the "error" field. A crash can answer with a page, not JSON.
  const answer: unknown = await response.json().catch(() => null);
  const reason =
    answer && typeof answer === "object" && "error" in answer && typeof answer.error === "string"
      ? answer.error
      : "";
  throw new ApiError(reason, response.status);
}

async function json<Answer>(method: string, url: string, options?: Options): Promise<Answer> {
  const response = await send(method, url, options);
  try {
    return (await response.json()) as Answer;
  } catch {
    throw new ApiError("", response.status);
  }
}

// ---- The model ---------------------------------------------------------------

// Check one answer of a drill. Each drill has its own address.
export function gradeAnswer(url: string, body: object): Promise<{ grade: Grade; model: string }> {
  return json("POST", url, { body });
}

export function askHelper(
  context: HelperContext,
  messages: ChatMessage[],
): Promise<{ reply: string }> {
  return json("POST", "/api/chat", { body: { context, messages } });
}

// Write a worked answer for a problem. The answer is the ID of the new kata.
export function solveProblem(text: string): Promise<{ id: string }> {
  return json("POST", "/api/solve", { body: { text } });
}

// Review one attempt on a kata. The answer is the ID of the saved attempt.
// The elements are the canvas elements as they are. The server checks their form.
export function reviewAttempt(
  attempt: Omit<ReviewRequest, "elements"> & { elements: readonly object[] },
): Promise<{ id: string }> {
  return json("POST", "/api/review", { body: attempt });
}

// ---- Settings, and the services that they select --------------------------------

export function saveSettings(settings: Settings): Promise<PublicSettings> {
  return json("PUT", "/api/settings", { body: settings });
}

// Send a small request with the saved settings. The server gives details also when the test
// fails, so this function returns the answer for each status.
export async function testConnection(): Promise<{ ok: boolean; model?: string; error?: string }> {
  const response = await fetch("/api/settings/test", { method: "POST" });
  return response.json();
}

export function listVertexModels(
  project: string,
  location: string,
): Promise<{ gemini: string[]; claude: string[] }> {
  return json("GET", `/api/vertex/models?${new URLSearchParams({ project, location })}`);
}

// The audio of a text, from the Google voice.
export async function speechClip(text: string): Promise<Blob> {
  return (await send("POST", "/api/speech", { body: { text } })).blob();
}

// ---- Boards ------------------------------------------------------------------------

export function createBoard(): Promise<{ id: string }> {
  return json("POST", "/api/boards");
}

export async function saveBoard(
  id: string,
  board: { title: string; notes: string; scene: { elements: readonly unknown[]; files: unknown } },
): Promise<void> {
  await send("PUT", `/api/boards/${id}`, { body: board, keepalive: true });
}

// ---- The notebook --------------------------------------------------------------------

export async function saveNote(id: string, note: { title: string; html: string }): Promise<void> {
  await send("PUT", `/api/notebook/notes/${id}`, { body: note, keepalive: true });
}

export async function savePageNote(note: {
  page: string;
  title: string;
  html: string;
}): Promise<void> {
  await send("PUT", "/api/notebook/pages", { body: note, keepalive: true });
}

export function addHighlight(
  highlight: Pick<Highlight, "page" | "title" | "text" | "start" | "note">,
): Promise<Highlight> {
  return json("POST", "/api/notebook/highlights", { body: highlight });
}

export function createStory(fields: StoryFields): Promise<Story> {
  return json("POST", "/api/notebook/stories", { body: fields });
}

export function saveStory(id: string, fields: StoryFields): Promise<Story> {
  return json("PUT", `/api/notebook/stories/${id}`, { body: fields });
}

// ---- Deletes ---------------------------------------------------------------------------

// Delete the thing at an address. A page gives the address to the confirm button.
export async function deleteAt(url: string): Promise<void> {
  await send("DELETE", url);
}
