import { jsonFile } from "./json-file";
import { competencies, type Story, type StoryFields } from "./stories";

export type { Story, StoryFields } from "./stories";

// A passage that the user highlighted on a learning page.
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

// A place on a learning page that the user wants to find again: the page, or one section of it.
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

// The notes of one learning page, as HTML.
export type PageNote = { page: string; title: string; html: string; updatedAt: string };

// A general note, not tied to a page. The user gives it a title, for example "Questions".
export type NoteDoc = {
  id: string;
  title: string;
  html: string;
  createdAt: string;
  updatedAt: string;
  // An insights document is written by the AI from the marks of the notebook.
  kind?: "insights";
};

export type Notebook = {
  documents: NoteDoc[];
  pages: PageNote[];
  highlights: Highlight[];
  bookmarks: Bookmark[];
  stories: Story[];
};

const UNTITLED = "Untitled note";

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
      id: newId(),
      title: "General notes",
      html: saved.notes,
      createdAt: now,
      updatedAt: now,
    });
  }
  return notebook;
}

const store = jsonFile("notebook.json", normalize);
export const readNotebook = store.read;
const change = store.change;

export function addHighlight(
  input: Pick<Highlight, "page" | "title" | "text" | "start" | "note">,
): Promise<Highlight> {
  return change((notebook) => {
    const highlight: Highlight = { ...input, id: newId(), createdAt: new Date().toISOString() };
    notebook.highlights.push(highlight);
    return highlight;
  });
}

export function updateHighlightNote(id: string, note: string): Promise<Highlight | undefined> {
  return change((notebook) => {
    const highlight = notebook.highlights.find((item) => item.id === id);
    if (highlight) highlight.note = note;
    return highlight;
  });
}

export function removeHighlight(id: string): Promise<void> {
  return change((notebook) => {
    notebook.highlights = notebook.highlights.filter((item) => item.id !== id);
  });
}

// Add a bookmark. A second bookmark for the same place returns the first one.
export function addBookmark(
  input: Pick<Bookmark, "page" | "title" | "heading" | "anchor">,
): Promise<Bookmark> {
  return change((notebook) => {
    const found = notebook.bookmarks.find(
      (item) => item.page === input.page && item.anchor === input.anchor,
    );
    if (found) return found;
    const bookmark: Bookmark = { ...input, id: newId(), createdAt: new Date().toISOString() };
    notebook.bookmarks.push(bookmark);
    return bookmark;
  });
}

export function removeBookmark(id: string): Promise<void> {
  return change((notebook) => {
    notebook.bookmarks = notebook.bookmarks.filter((item) => item.id !== id);
  });
}

// Save the notes of a page. Empty notes remove the entry.
export function savePageNote(input: Pick<PageNote, "page" | "title" | "html">): Promise<void> {
  return change((notebook) => {
    notebook.pages = notebook.pages.filter((item) => item.page !== input.page);
    if (input.html.trim()) notebook.pages.push({ ...input, updatedAt: new Date().toISOString() });
  });
}

export function createDocument(title: string): Promise<NoteDoc> {
  return change((notebook) => {
    const now = new Date().toISOString();
    const document: NoteDoc = {
      id: newId(),
      title: title.trim() || UNTITLED,
      html: "",
      createdAt: now,
      updatedAt: now,
    };
    notebook.documents.push(document);
    return document;
  });
}

// Save an insights document as a new general note.
export function addInsightsDocument(title: string, html: string): Promise<NoteDoc> {
  return change((notebook) => {
    const now = new Date().toISOString();
    const document: NoteDoc = {
      id: newId(),
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

export function createStory(fields: StoryFields): Promise<Story> {
  return change((notebook) => {
    const now = new Date().toISOString();
    const story: Story = { ...cleanStory(fields), id: newId(), createdAt: now, updatedAt: now };
    notebook.stories.push(story);
    return story;
  });
}

export function updateStory(id: string, fields: StoryFields): Promise<Story | undefined> {
  return change((notebook) => {
    const story = notebook.stories.find((item) => item.id === id);
    if (!story) return undefined;
    Object.assign(story, cleanStory(fields), { updatedAt: new Date().toISOString() });
    return story;
  });
}

export function deleteStory(id: string): Promise<void> {
  return change((notebook) => {
    notebook.stories = notebook.stories.filter((item) => item.id !== id);
  });
}
