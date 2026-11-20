import { escapeHtml } from "./text";

// Notes are saved as HTML. These functions do not use the browser, so the server can call them too.

// Notes are HTML. Older notes are plain text. Convert those to paragraphs.
export function toNotesHtml(saved: string): string {
  if (!saved || saved.trimStart().startsWith("<")) return saved;
  return saved
    .split("\n")
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

const entities: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

// Convert the notes to plain text, for the help chat, the saved attempt, and the list of boards.
// This function does not use the browser, so the server can call it too.
export function notesText(html: string): string {
  return toNotesHtml(html)
    .replace(/<li[^>]*>/g, "- ")
    .replace(/<\/(p|h[1-6]|li|blockquote)>/g, "\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => entities[entity])
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
