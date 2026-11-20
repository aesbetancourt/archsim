import type { Grade } from "@/lib/ai/drill-grade";
import type { InsightsStatus } from "@/lib/ai/insights-job";
import type { ChatMessage, HelperContext } from "@/lib/ai/helper";
import type { SearchItem } from "@/lib/content/search";
import type { ReviewRequest } from "@/lib/requests";
import type { TourId } from "@/lib/content/tours";
import type { Bookmark, Highlight, NoteDoc } from "@/lib/store/notebook";
import type { Onboarding } from "@/lib/store/onboarding";
import type { PublicSettings, Settings } from "@/lib/store/settings";
import type { Story, StoryFields } from "@/lib/store/stories";

// The requests from the browser to the server of the app.
// A component calls a function of this file. It does not call fetch.
// When the data comes from a different place, for example in a desktop app, change this file only.

/**
 * A request that the server refused, or an answer that is not JSON.
 * The message is the reason that the server gave. It is empty when the server gave none, for
 * example after a crash. Then the caller shows its own text.
 * @example
 * if (caught instanceof ApiError && !caught.message) setCheckError(`HTTP ${caught.status}`);
 */
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

// The server gives the reason in the "error" field. A crash can answer with a page, not JSON.
function serverReason(answer: unknown): string {
  if (!answer || typeof answer !== "object" || !("error" in answer)) return "";
  if (typeof answer.error !== "string") return "";
  return answer.error;
}

async function send(method: string, url: string, options: Options = {}): Promise<Response> {
  const hasBody = options.body !== undefined;
  const response = await fetch(url, {
    method,
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    keepalive: options.keepalive,
  });
  if (response.ok) return response;
  const answer: unknown = await response.json().catch(() => null);
  throw new ApiError(serverReason(answer), response.status);
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

/**
 * Check one answer of a drill. Each drill has its own address.
 * @param url The address of the drill on the server.
 * @param body The answer and the data that the drill needs.
 * @returns The grade, and the model that gave it.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const { grade } = await gradeAnswer(gradeUrl, gradeBody(current, answer));
 */
export function gradeAnswer(url: string, body: object): Promise<{ grade: Grade; model: string }> {
  return json("POST", url, { body });
}

/**
 * Send the conversation with the helper, and get its next reply.
 * @param context The page that the person reads, for the helper.
 * @param messages The conversation until now, with the newest message last.
 * @returns The reply of the helper.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const { reply } = await askHelper(getContext(), [...messages, { role: "user", text }]);
 */
export function askHelper(
  context: HelperContext,
  messages: ChatMessage[],
): Promise<{ reply: string }> {
  return json("POST", "/api/chat", { body: { context, messages } });
}

/**
 * Write a worked answer for a problem.
 * @param text The problem, in the words of the person.
 * @returns The ID of the new kata.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const { id } = await solveProblem("Design a URL shortener.");
 */
export function solveProblem(text: string): Promise<{ id: string }> {
  return json("POST", "/api/solve", { body: { text } });
}

/**
 * Review one attempt on a kata.
 * @param attempt The attempt. The elements are the canvas elements as they are. The server checks
 * their form.
 * @returns The ID of the saved attempt.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const { id } = await reviewAttempt({ ...attempt, elements: scene.elements });
 */
export function reviewAttempt(
  attempt: Omit<ReviewRequest, "elements"> & { elements: readonly object[] },
): Promise<{ id: string }> {
  return json("POST", "/api/review", { body: attempt });
}

// ---- Settings, and the services that they select --------------------------------

/**
 * Read the settings without the API keys. The keys stay on the server.
 * @returns The settings, with no API keys.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const settings = await readSettings();
 */
export function readSettings(): Promise<PublicSettings> {
  return json("GET", "/api/settings");
}

/**
 * Save the settings.
 * @param settings The new settings, with the API keys.
 * @returns The saved settings, with no API keys.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const saved = await saveSettings(draft);
 */
export function saveSettings(settings: Settings): Promise<PublicSettings> {
  return json("PUT", "/api/settings", { body: settings });
}

/**
 * Send a small request with the saved settings. The server gives details also when the test
 * fails, so this function returns the answer for each status.
 * @returns Whether the test passed, the model that answered, or the reason of the failure.
 * @throws {TypeError} When the network fails.
 * @throws {SyntaxError} When the answer is not JSON.
 * @example
 * const { ok, error } = await testConnection();
 */
export async function testConnection(): Promise<{ ok: boolean; model?: string; error?: string }> {
  const response = await fetch("/api/settings/test", { method: "POST" });
  return response.json();
}

/**
 * List the Gemini and Claude models that a Vertex AI project can use.
 * @param project The ID of the Google Cloud project.
 * @param location The region of the models, for example "us-east5".
 * @returns The model names, in two lists.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const { gemini, claude } = await listVertexModels("my-project", "us-east5");
 */
export function listVertexModels(
  project: string,
  location: string,
): Promise<{ gemini: string[]; claude: string[] }> {
  return json("GET", `/api/vertex/models?${new URLSearchParams({ project, location })}`);
}

/**
 * Get the audio of a text, from the Google voice.
 * @param text The text to read aloud.
 * @returns The audio.
 * @throws {ApiError} When the server refuses the request.
 * @example
 * const audio = new Audio(URL.createObjectURL(await speechClip(sentence)));
 */
export async function speechClip(text: string): Promise<Blob> {
  return (await send("POST", "/api/speech", { body: { text } })).blob();
}

// ---- The search ----------------------------------------------------------------------

/**
 * Get the lessons, katas, terms, cheatsheets, and questions, as items for the search.
 * @returns The items for the search.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const items = await searchIndex();
 */
export function searchIndex(): Promise<SearchItem[]> {
  return json("GET", "/api/search");
}

// ---- Boards ------------------------------------------------------------------------

/**
 * Make a new empty board.
 * @returns The ID of the new board.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const { id } = await createBoard();
 */
export function createBoard(): Promise<{ id: string }> {
  return json("POST", "/api/boards");
}

/**
 * Save a board. The save continues when the person leaves the page.
 * @param id The ID of the board.
 * @param board The title, the notes, and the drawing of the board.
 * @throws {ApiError} When the server refuses the request.
 * @example
 * await saveBoard(id, { title, notes, scene: { elements, files } });
 */
export async function saveBoard(
  id: string,
  board: { title: string; notes: string; scene: { elements: readonly unknown[]; files: unknown } },
): Promise<void> {
  await send("PUT", `/api/boards/${id}`, { body: board, keepalive: true });
}

// ---- The lesson progress -------------------------------------------------------------

/**
 * Read the lessons marked as done, each with the time of the mark.
 * @returns The time of the mark, by the slug of the lesson.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const { done } = await readProgress();
 */
export function readProgress(): Promise<{ done: Record<string, string> }> {
  return json("GET", "/api/progress");
}

/**
 * Mark a lesson as done, or remove the mark.
 * @param slug The slug of the lesson.
 * @param done True to mark the lesson as done. False to remove the mark.
 * @throws {ApiError} When the server refuses the request.
 * @example
 * await setLessonDone("caching", true);
 */
export async function setLessonDone(slug: string, done: boolean): Promise<void> {
  await send("PUT", "/api/progress", { body: { slug, done } });
}

// ---- The onboarding tours -----------------------------------------------------------

/**
 * Read the tours that the person saw.
 * @returns The onboarding state.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const onboarding = await readOnboarding();
 */
export function readOnboarding(): Promise<Onboarding> {
  return json("GET", "/api/onboarding");
}

/**
 * Mark a tour as seen, or remove the mark so that the tour shows again.
 * @param tour The ID of the tour.
 * @param seen True to mark the tour as seen. False to show it again.
 * @throws {ApiError} When the server refuses the request.
 * @example
 * await setTourSeen("welcome", true);
 */
export async function setTourSeen(tour: TourId, seen: boolean): Promise<void> {
  await send("PUT", "/api/onboarding", { body: { tour, seen } });
}

// ---- The notebook --------------------------------------------------------------------

/**
 * List the bookmarks of one page.
 * @param page The address of the page.
 * @returns The bookmarks of the page.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const bookmarks = await listBookmarks("/learn/caching");
 */
export function listBookmarks(page: string): Promise<Bookmark[]> {
  return json("GET", `/api/notebook/bookmarks?page=${encodeURIComponent(page)}`);
}

/**
 * Add a bookmark to a heading of a page.
 * @param bookmark The page, its title, the heading, and the anchor of the heading.
 * @returns The saved bookmark.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const saved = await addBookmark({ page, title, heading: "Eviction", anchor: "eviction" });
 */
export function addBookmark(
  bookmark: Pick<Bookmark, "page" | "title" | "heading" | "anchor">,
): Promise<Bookmark> {
  return json("POST", "/api/notebook/bookmarks", { body: bookmark });
}

/**
 * Remove a bookmark.
 * @param id The ID of the bookmark.
 * @throws {ApiError} When the server refuses the request.
 * @example
 * await removeBookmark(bookmark.id);
 */
export async function removeBookmark(id: string): Promise<void> {
  await send("DELETE", `/api/notebook/bookmarks/${id}`);
}

/**
 * List the notes of the notebook.
 * @returns The notes.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const notes = await listNotes();
 */
export function listNotes(): Promise<NoteDoc[]> {
  return json("GET", "/api/notebook/notes");
}

/**
 * Make a new note in the notebook.
 * @param title The title of the note.
 * @returns The new note.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const note = await createNote("Interview questions");
 */
export function createNote(title: string): Promise<NoteDoc> {
  return json("POST", "/api/notebook/notes", { body: { title } });
}

/**
 * Read the state of the job that writes an insights document.
 * @returns The state of the job.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const status = await insightsStatus();
 */
export function insightsStatus(): Promise<InsightsStatus> {
  return json("GET", "/api/notebook/insights");
}

/**
 * Start the job that writes an insights document.
 * @returns The state of the job.
 * @throws {ApiError} When the server refuses the request, for example when the notebook is
 * empty, or when the answer is not JSON.
 * @example
 * const status = await startInsights();
 */
export function startInsights(): Promise<InsightsStatus> {
  return json("POST", "/api/notebook/insights");
}

/**
 * Save a note of the notebook. The save continues when the person leaves the page.
 * @param id The ID of the note.
 * @param note The title and the HTML text of the note.
 * @throws {ApiError} When the server refuses the request.
 * @example
 * await saveNote(note.id, { title, html });
 */
export async function saveNote(id: string, note: { title: string; html: string }): Promise<void> {
  await send("PUT", `/api/notebook/notes/${id}`, { body: note, keepalive: true });
}

/**
 * Save the notes of one page. The save continues when the person leaves the page.
 * @param note The address and the title of the page, and the notes as HTML.
 * @throws {ApiError} When the server refuses the request.
 * @example
 * await savePageNote({ page: "/learn/caching", title: "Caching", html });
 */
export async function savePageNote(note: {
  page: string;
  title: string;
  html: string;
}): Promise<void> {
  await send("PUT", "/api/notebook/pages", { body: note, keepalive: true });
}

/**
 * Read the notes of one page, as HTML.
 * @param page The address of the page.
 * @returns The notes as HTML. A page with no notes has an empty text.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const { html } = await readPageNote("/learn/caching");
 */
export function readPageNote(page: string): Promise<{ html: string }> {
  return json("GET", `/api/notebook/pages?page=${encodeURIComponent(page)}`);
}

/**
 * List the highlights of one page.
 * @param page The address of the page.
 * @returns The highlights of the page.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const highlights = await listHighlights("/learn/caching");
 */
export function listHighlights(page: string): Promise<Highlight[]> {
  return json("GET", `/api/notebook/highlights?page=${encodeURIComponent(page)}`);
}

/**
 * Add a highlight to a text on a page.
 * @param highlight The page, its title, the text, the start of the text, and the note.
 * @returns The saved highlight.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const saved = await addHighlight({ page, title, text, start, note: "" });
 */
export function addHighlight(
  highlight: Pick<Highlight, "page" | "title" | "text" | "start" | "note">,
): Promise<Highlight> {
  return json("POST", "/api/notebook/highlights", { body: highlight });
}

/**
 * Save the note of one highlight.
 * @param id The ID of the highlight.
 * @param note The new note.
 * @returns The changed highlight.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const changed = await changeHighlightNote(highlight.id, "Ask about this.");
 */
export function changeHighlightNote(id: string, note: string): Promise<Highlight> {
  return json("PATCH", `/api/notebook/highlights/${id}`, { body: { note } });
}

/**
 * Remove a highlight.
 * @param id The ID of the highlight.
 * @throws {ApiError} When the server refuses the request.
 * @example
 * await removeHighlight(highlight.id);
 */
export async function removeHighlight(id: string): Promise<void> {
  await send("DELETE", `/api/notebook/highlights/${id}`);
}

/**
 * List the stories of the notebook.
 * @returns The stories.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const stories = await listStories();
 */
export function listStories(): Promise<Story[]> {
  return json("GET", "/api/notebook/stories");
}

/**
 * Make a new story in the notebook.
 * @param fields The fields of the story.
 * @returns The new story.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const story = await createStory(fields);
 */
export function createStory(fields: StoryFields): Promise<Story> {
  return json("POST", "/api/notebook/stories", { body: fields });
}

/**
 * Save the changes to a story.
 * @param id The ID of the story.
 * @param fields The new fields of the story.
 * @returns The saved story.
 * @throws {ApiError} When the server refuses the request, or the answer is not JSON.
 * @example
 * const saved = await saveStory(story.id, fields);
 */
export function saveStory(id: string, fields: StoryFields): Promise<Story> {
  return json("PUT", `/api/notebook/stories/${id}`, { body: fields });
}

// ---- Deletes ---------------------------------------------------------------------------

/**
 * Delete the thing at an address. A page gives the address to the confirm button.
 * @param url The address of the thing to delete.
 * @throws {ApiError} When the server refuses the request.
 * @example
 * await deleteAt(endpoint);
 */
export async function deleteAt(url: string): Promise<void> {
  await send("DELETE", url);
}
