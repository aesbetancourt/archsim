import { toNotesHtml } from "@/lib/notes-html";

// The notes of a kata are saved in the browser as HTML, for each kata.
const notesKey = (kataId: string) => `charrette:notes:${kataId}`;

/**
 * Read the saved notes of a kata.
 * @param kataId The ID of the kata.
 * @returns The notes as HTML. Empty notes when there are none or the storage is not available.
 * @example
 * const html = loadNotesHtml(kata.id);
 */
export function loadNotesHtml(kataId: string): string {
  let saved = "";
  try {
    saved = localStorage.getItem(notesKey(kataId)) ?? "";
  } catch {
    // Storage is not available. Start with empty notes.
  }
  return toNotesHtml(saved);
}

/**
 * Save the notes of a kata. When the storage is not available, the notes last for this page
 * only.
 * @param kataId The ID of the kata.
 * @param html The notes as HTML. An empty text clears the notes.
 * @example
 * saveNotesHtml(kata.id, "");
 */
export function saveNotesHtml(kataId: string, html: string): void {
  try {
    localStorage.setItem(notesKey(kataId), html);
  } catch {
    // Storage is not available. The notes last for this page only.
  }
}
