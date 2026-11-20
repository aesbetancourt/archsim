import { toNotesHtml } from "@/lib/notes-html";

// The notes of a kata are saved in the browser as HTML, for each kata.
const notesKey = (kataId: string) => `charrette:notes:${kataId}`;

// Read the saved notes of a kata.
export function loadNotesHtml(kataId: string): string {
  let saved = "";
  try {
    saved = localStorage.getItem(notesKey(kataId)) ?? "";
  } catch {
    // Storage is not available. Start with empty notes.
  }
  return toNotesHtml(saved);
}

export function saveNotesHtml(kataId: string, html: string): void {
  try {
    localStorage.setItem(notesKey(kataId), html);
  } catch {
    // Storage is not available. The notes last for this page only.
  }
}
