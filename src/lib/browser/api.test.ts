import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage, HelperContext } from "@/lib/ai/helper";
import type { ReviewRequest } from "@/lib/requests";
import type { Settings } from "@/lib/store/settings";
import {
  addBookmark,
  addHighlight,
  ApiError,
  askHelper,
  changeHighlightNote,
  createBoard,
  createNote,
  createStory,
  deleteAt,
  gradeAnswer,
  insightsStatus,
  listBookmarks,
  listHighlights,
  listNotes,
  listStories,
  listVertexModels,
  readPageNote,
  readProgress,
  readSettings,
  removeBookmark,
  removeHighlight,
  reviewAttempt,
  saveBoard,
  saveNote,
  savePageNote,
  saveSettings,
  saveStory,
  searchIndex,
  setLessonDone,
  solveProblem,
  speechClip,
  startInsights,
  testConnection,
} from "./api";

type Call = {
  url: string;
  method?: string;
  headers?: unknown;
  body?: unknown;
  keepalive?: boolean;
};

// Answer each request with one response, and keep what was sent.
function server(response: Response) {
  const calls: Call[] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    calls.push({
      url,
      method: init.method,
      headers: init.headers,
      body: typeof init.body === "string" ? JSON.parse(init.body) : init.body,
      keepalive: init.keepalive,
    });
    return response.clone();
  });
  return calls;
}
const ok = (body: unknown) => Response.json(body);
const JSON_HEADERS = { "Content-Type": "application/json" };

afterEach(() => vi.unstubAllGlobals());

describe("the requests", () => {
  it("sends a body as JSON, and returns the answer", async () => {
    const calls = server(ok({ reply: "Use a queue." }));
    const context: HelperContext = { kind: "board", title: "B", notes: "", elements: [] };
    const messages: ChatMessage[] = [{ role: "user", text: "Why?" }];

    expect(await askHelper(context, messages)).toEqual({ reply: "Use a queue." });
    expect(calls).toEqual([
      {
        url: "/api/chat",
        method: "POST",
        headers: JSON_HEADERS,
        body: { context, messages },
        keepalive: undefined,
      },
    ]);
  });

  it("sends no body and no JSON header when there is nothing to send", async () => {
    const calls = server(ok({ id: "b1" }));
    expect(await createBoard()).toEqual({ id: "b1" });
    await deleteAt("/api/boards/b1");
    expect(calls).toEqual([
      {
        url: "/api/boards",
        method: "POST",
        headers: undefined,
        body: undefined,
        keepalive: undefined,
      },
      {
        url: "/api/boards/b1",
        method: "DELETE",
        headers: undefined,
        body: undefined,
        keepalive: undefined,
      },
    ]);
  });

  it("uses the address, the method, and the body of each endpoint", async () => {
    const calls = server(ok({ id: "x", grade: {}, model: "m" }));
    const story = {
      title: "T",
      situation: "",
      task: "",
      action: "",
      result: "",
      reflection: "",
      competencies: [],
    };
    const highlight = { page: "/kata/k", title: "K (kata)", text: "words", start: 3, note: "" };

    await gradeAnswer("/api/drill/question", { questionId: "q", answer: "a" });
    await solveProblem("A problem.");
    await reviewAttempt({ kataId: "k" } as ReviewRequest);
    await saveSettings({ mode: "vertex" } as Settings);
    await listVertexModels("my project", "us-east5");
    await addHighlight(highlight);
    await createStory(story);
    await saveStory("s1", story);

    expect(calls.map((call) => [call.method, call.url, call.body])).toEqual([
      ["POST", "/api/drill/question", { questionId: "q", answer: "a" }],
      ["POST", "/api/solve", { text: "A problem." }],
      ["POST", "/api/review", { kataId: "k" }],
      ["PUT", "/api/settings", { mode: "vertex" }],
      ["GET", "/api/vertex/models?project=my+project&location=us-east5", undefined],
      ["POST", "/api/notebook/highlights", highlight],
      ["POST", "/api/notebook/stories", story],
      ["PUT", "/api/notebook/stories/s1", story],
    ]);
  });

  it("keeps a save alive when the person leaves the page", async () => {
    const calls = server(ok({ ok: true }));
    await saveBoard("b1", { title: "B", notes: "", scene: { elements: [], files: {} } });
    await saveNote("n1", { title: "N", html: "<p>x</p>" });
    await savePageNote({ page: "/learn/caching", title: "Caching", html: "<p>x</p>" });

    expect(calls.map((call) => [call.method, call.url, call.keepalive])).toEqual([
      ["PUT", "/api/boards/b1", true],
      ["PUT", "/api/notebook/notes/n1", true],
      ["PUT", "/api/notebook/pages", true],
    ]);
    expect(calls[1].body).toEqual({ title: "N", html: "<p>x</p>" });
  });

  it("returns the audio of the Google voice", async () => {
    const calls = server(
      new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": "audio/mpeg" } }),
    );
    const clip = await speechClip("Read this.");
    expect(clip.size).toBe(3);
    expect(calls[0]).toMatchObject({
      url: "/api/speech",
      method: "POST",
      body: { text: "Read this." },
    });
  });
});

describe("the requests for shared data", () => {
  it("uses the address, the method, and the body of each endpoint", async () => {
    const calls = server(ok({ done: {}, status: "idle" }));
    const bookmark = { page: "/learn/a b", title: "T", heading: "H", anchor: "h" };

    await readProgress();
    await setLessonDone("caching", true);
    await listBookmarks("/learn/a b");
    await addBookmark(bookmark);
    await removeBookmark("b1");
    await listNotes();
    await createNote("");
    await insightsStatus();
    await startInsights();
    await listHighlights("/learn/a b");
    await changeHighlightNote("h1", "A note.");
    await removeHighlight("h1");
    await readPageNote("/learn/a b");
    await listStories();
    await searchIndex();
    await readSettings();

    expect(calls.map((call) => [call.method, call.url, call.body])).toEqual([
      ["GET", "/api/progress", undefined],
      ["PUT", "/api/progress", { slug: "caching", done: true }],
      ["GET", "/api/notebook/bookmarks?page=%2Flearn%2Fa%20b", undefined],
      ["POST", "/api/notebook/bookmarks", bookmark],
      ["DELETE", "/api/notebook/bookmarks/b1", undefined],
      ["GET", "/api/notebook/notes", undefined],
      ["POST", "/api/notebook/notes", { title: "" }],
      ["GET", "/api/notebook/insights", undefined],
      ["POST", "/api/notebook/insights", undefined],
      ["GET", "/api/notebook/highlights?page=%2Flearn%2Fa%20b", undefined],
      ["PATCH", "/api/notebook/highlights/h1", { note: "A note." }],
      ["DELETE", "/api/notebook/highlights/h1", undefined],
      ["GET", "/api/notebook/pages?page=%2Flearn%2Fa%20b", undefined],
      ["GET", "/api/notebook/stories", undefined],
      ["GET", "/api/search", undefined],
      ["GET", "/api/settings", undefined],
    ]);
  });

  it("refuses to load the notes of a page when the server fails, so no empty editor opens", async () => {
    server(new Response("<html>Crash</html>", { status: 500 }));
    await expect(readPageNote("/learn/caching")).rejects.toBeInstanceOf(ApiError);
  });

  it("refuses to start the insights job with the reason of the server", async () => {
    server(Response.json({ error: "The notebook is empty." }, { status: 400 }));
    await expect(startInsights()).rejects.toMatchObject({
      message: "The notebook is empty.",
      status: 400,
    });
  });
});

describe("a refused request", () => {
  it("gives the reason of the server and the status", async () => {
    server(Response.json({ error: "The model is busy." }, { status: 502 }));
    const error = await solveProblem("x").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: "The model is busy.", status: 502 });
  });

  it("gives an empty reason when the server crashes with a page that is not JSON", async () => {
    server(new Response("<html>boom</html>", { status: 500 }));
    const error = await gradeAnswer("/api/drill/grade", {}).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ message: "", status: 500 });
  });

  it("gives an empty reason when an answer with status 200 is not JSON", async () => {
    server(new Response("", { status: 200 }));
    const error = await gradeAnswer("/api/drill/grade", {}).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: "", status: 200 });
  });

  it("is an error also for a save and a delete", async () => {
    server(Response.json({ error: "No." }, { status: 500 }));
    await expect(saveNote("n1", { title: "", html: "" })).rejects.toBeInstanceOf(ApiError);
    await expect(deleteAt("/api/notebook/notes/n1")).rejects.toMatchObject({ message: "No." });
  });
});

describe("the connection test", () => {
  it("returns the details of the server also when the test fails", async () => {
    const calls = server(Response.json({ ok: false, error: "No key is set." }, { status: 502 }));
    expect(await testConnection()).toEqual({ ok: false, error: "No key is set." });
    expect(calls[0]).toMatchObject({ url: "/api/settings/test", method: "POST" });
  });
});
