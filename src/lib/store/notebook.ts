import { jsonFile } from "./json-file";
import { competencies, type Story, type StoryFields } from "./stories";
import { timeId } from "@/lib/random-id";

/** The story types of the notebook, from the story bank. */
export type { Story, StoryFields } from "./stories";

/** A passage that the user highlighted on a learning page. */
export type Highlight = {
  id: string;
  // The path of the page, for example /learn/caching.
  page: string;
  // The title of the page when the user made the highlight.
  title: string;
  // The highlighted text. The page finds the passage again with this text if the page changes.
  text: string;
  // The position of the passage in the text of the page.
  start: number;
  note: string;
  createdAt: string;
};

/** A place on a learning page that the user wants to find again: the page, or one section of it. */
export type Bookmark = {
  id: string;
  // The path of the page, for example /learn/caching.
  page: string;
  // The title of the page when the user made the bookmark.
  title: string;
  // The text of the heading.
  heading: string;
  // The id of the section heading, for example "eviction". It is empty for the whole page.
  anchor: string;
  createdAt: string;
};

/** The notes of one learning page, as HTML. */
export type PageNote = { page: string; title: string; html: string; updatedAt: string };

/** A general note, not tied to a page. The user gives it a title, for example "Questions". */
export type NoteDoc = {
  id: string;
  title: string;
  html: string;
  createdAt: string;
  updatedAt: string;
  // An insights document is written by the AI from the marks of the notebook.
  kind?: "insights";
};

/** All the marks and notes of the user. It is saved in data/notebook.json. */
export type Notebook = {
  documents: NoteDoc[];
  pages: PageNote[];
  highlights: Highlight[];
  bookmarks: Bookmark[];
  stories: Story[];
};

const UNTITLED = "Untitled note";

const list = <T>(value: unknown): T[] => (Array.isArray(value) ? value : []);

function normalize(value: unknown): Notebook {
  const saved = (value ?? {}) as Partial<Notebook> & { notes?: unknown };
  const notebook: Notebook = {
    documents: list(saved.documents),
    pages: list(saved.pages),
    highlights: list(saved.highlights),
    bookmarks: list(saved.bookmarks),
    stories: list(saved.stories),
  };
  // An older notebook had one notes document. Keep it as the first general note.
  if (typeof saved.notes === "string" && saved.notes.trim()) {
    const now = new Date().toISOString();
    notebook.documents.unshift({
      id: timeId(),
      title: "General notes",
      html: saved.notes,
      createdAt: now,
      updatedAt: now,
    });
  }
  return notebook;
}

const store = jsonFile("notebook.json", normalize);
/**
 * Read the notebook from data/notebook.json.
 * A missing or damaged file gives an empty notebook. An old single notes document becomes a general note.
 * @example
 * const { highlights, bookmarks } = await readNotebook();
 */
export const readNotebook = store.read;
const change = store.change;

/**
 * Add a highlight to data/notebook.json, with a new ID and the current time.
 * @param input The page, the text, the position, and the note of the highlight.
 * @returns The new highlight.
 * @throws When the app cannot write data/notebook.json.
 * @example
 * const highlight = await addHighlight({ page: "/learn/caching", title, text, start, note: "" });
 */
export function addHighlight(
  input: Pick<Highlight, "page" | "title" | "text" | "start" | "note">,
): Promise<Highlight> {
  return change((notebook) => {
    const highlight: Highlight = { ...input, id: timeId(), createdAt: new Date().toISOString() };
    notebook.highlights.push(highlight);
    return highlight;
  });
}

/**
 * Change the note of a highlight in data/notebook.json.
 * @param id The ID of the highlight.
 * @param note The new note.
 * @returns The changed highlight, or undefined when it does not exist.
 * @throws When the app cannot write data/notebook.json.
 * @example
 * await updateHighlightNote(id, "Compare with write-through.");
 */
export function updateHighlightNote(id: string, note: string): Promise<Highlight | undefined> {
  return change((notebook) => {
    const highlight = notebook.highlights.find((item) => item.id === id);
    if (highlight) highlight.note = note;
    return highlight;
  });
}

/**
 * Remove a highlight from data/notebook.json. An ID that does not exist is not an error.
 * @param id The ID of the highlight.
 * @returns A promise that resolves when the file is saved.
 * @throws When the app cannot write data/notebook.json.
 * @example
 * await removeHighlight(id);
 */
export function removeHighlight(id: string): Promise<void> {
  return change((notebook) => {
    notebook.highlights = notebook.highlights.filter((item) => item.id !== id);
  });
}

/**
 * Add a bookmark to data/notebook.json. A second bookmark for the same place returns the first one.
 * @param input The page, the title, the heading, and the anchor of the bookmark.
 * @returns The new bookmark, or the bookmark that was there.
 * @throws When the app cannot write data/notebook.json.
 * @example
 * await addBookmark({ page: "/learn/caching", title, heading: "Eviction", anchor: "eviction" });
 */
export function addBookmark(
  input: Pick<Bookmark, "page" | "title" | "heading" | "anchor">,
): Promise<Bookmark> {
  return change((notebook) => {
    const found = notebook.bookmarks.find(
      (item) => item.page === input.page && item.anchor === input.anchor,
    );
    if (found) return found;
    const bookmark: Bookmark = { ...input, id: timeId(), createdAt: new Date().toISOString() };
    notebook.bookmarks.push(bookmark);
    return bookmark;
  });
}

/**
 * Remove a bookmark from data/notebook.json. An ID that does not exist is not an error.
 * @param id The ID of the bookmark.
 * @returns A promise that resolves when the file is saved.
 * @throws When the app cannot write data/notebook.json.
 * @example
 * await removeBookmark(id);
 */
export function removeBookmark(id: string): Promise<void> {
  return change((notebook) => {
    notebook.bookmarks = notebook.bookmarks.filter((item) => item.id !== id);
  });
}

/**
 * Save the notes of a page in data/notebook.json. Empty notes remove the entry.
 * @param input The page, its title, and the HTML of the notes.
 * @returns A promise that resolves when the file is saved.
 * @throws When the app cannot write data/notebook.json.
 * @example
 * await savePageNote({ page: "/learn/caching", title, html });
 */
export function savePageNote(input: Pick<PageNote, "page" | "title" | "html">): Promise<void> {
  return change((notebook) => {
    notebook.pages = notebook.pages.filter((item) => item.page !== input.page);
    if (input.html.trim()) notebook.pages.push({ ...input, updatedAt: new Date().toISOString() });
  });
}

/**
 * Add an empty general note to data/notebook.json. An empty title becomes "Untitled note".
 * @param title The title of the note.
 * @returns The new note.
 * @throws When the app cannot write data/notebook.json.
 * @example
 * const document = await createDocument("Questions");
 */
export function createDocument(title: string): Promise<NoteDoc> {
  return change((notebook) => {
    const now = new Date().toISOString();
    const document: NoteDoc = {
      id: timeId(),
      title: title.trim() || UNTITLED,
      html: "",
      createdAt: now,
      updatedAt: now,
    };
    notebook.documents.push(document);
    return document;
  });
}

/**
 * Save an insights document as a new general note in data/notebook.json.
 * @param title The title of the document.
 * @param html The HTML of the document.
 * @returns The new note.
 * @throws When the app cannot write data/notebook.json.
 * @example
 * await addInsightsDocument(`Insights · ${insights.title}`, insightsHtml(insights, byline));
 */
export function addInsightsDocument(title: string, html: string): Promise<NoteDoc> {
  return change((notebook) => {
    const now = new Date().toISOString();
    const document: NoteDoc = {
      id: timeId(),
      title,
      html,
      createdAt: now,
      updatedAt: now,
      kind: "insights",
    };
    notebook.documents.push(document);
    return document;
  });
}

/**
 * Change the title and the HTML of a general note in data/notebook.json.
 * An empty title becomes "Untitled note".
 * @param id The ID of the note.
 * @param update The new title and HTML.
 * @returns The changed note, or undefined when it does not exist.
 * @throws When the app cannot write data/notebook.json.
 * @example
 * await updateDocument(id, { title: "Questions", html });
 */
export function updateDocument(
  id: string,
  update: Pick<NoteDoc, "title" | "html">,
): Promise<NoteDoc | undefined> {
  return change((notebook) => {
    const document = notebook.documents.find((item) => item.id === id);
    if (!document) return undefined;
    document.title = update.title.trim() || UNTITLED;
    document.html = update.html;
    document.updatedAt = new Date().toISOString();
    return document;
  });
}

/**
 * Remove a general note from data/notebook.json. An ID that does not exist is not an error.
 * @param id The ID of the note.
 * @returns A promise that resolves when the file is saved.
 * @throws When the app cannot write data/notebook.json.
 * @example
 * await deleteDocument(id);
 */
export function deleteDocument(id: string): Promise<void> {
  return change((notebook) => {
    notebook.documents = notebook.documents.filter((item) => item.id !== id);
  });
}

const cleanStory = (fields: StoryFields): StoryFields => ({
  ...fields,
  title: fields.title.trim() || "Untitled story",
  competencies: fields.competencies.filter((item) =>
    (competencies as readonly string[]).includes(item),
  ),
});

/**
 * Add a story to data/notebook.json.
 * An empty title becomes "Untitled story". Unknown competencies are removed.
 * @param fields The title, the STAR parts, the reflection, and the competencies.
 * @returns The new story.
 * @throws When the app cannot write data/notebook.json.
 * @example
 * const story = await createStory(fields);
 */
export function createStory(fields: StoryFields): Promise<Story> {
  return change((notebook) => {
    const now = new Date().toISOString();
    const story: Story = { ...cleanStory(fields), id: timeId(), createdAt: now, updatedAt: now };
    notebook.stories.push(story);
    return story;
  });
}

/**
 * Change a story in data/notebook.json.
 * An empty title becomes "Untitled story". Unknown competencies are removed.
 * @param id The ID of the story.
 * @param fields The new title, STAR parts, reflection, and competencies.
 * @returns The changed story, or undefined when it does not exist.
 * @throws When the app cannot write data/notebook.json.
 * @example
 * await updateStory(id, fields);
 */
export function updateStory(id: string, fields: StoryFields): Promise<Story | undefined> {
  return change((notebook) => {
    const story = notebook.stories.find((item) => item.id === id);
    if (!story) return undefined;
    Object.assign(story, cleanStory(fields), { updatedAt: new Date().toISOString() });
    return story;
  });
}

/**
 * Remove a story from data/notebook.json. An ID that does not exist is not an error.
 * @param id The ID of the story.
 * @returns A promise that resolves when the file is saved.
 * @throws When the app cannot write data/notebook.json.
 * @example
 * await deleteStory(id);
 */
export function deleteStory(id: string): Promise<void> {
  return change((notebook) => {
    notebook.stories = notebook.stories.filter((item) => item.id !== id);
  });
}
