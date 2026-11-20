import { escapeHtml } from "./text";

// Notes are saved as HTML. These functions do not use the browser, so the server can call them too.

/**
 * Make sure that saved notes are HTML. Older notes are plain text, so this function converts
 * each line of them to a paragraph.
 * @param saved The saved notes, as HTML or as plain text. Can be empty.
 * @returns The notes as HTML. HTML and empty notes come back as they are.
 * @example
 * toNotesHtml("First idea\nSecond idea"); // "<p>First idea</p><p>Second idea</p>"
 */
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

/**
 * Convert the notes to plain text, for the help chat, the saved attempt, and the list of boards.
 * This function does not use the browser, so the server can call it too.
 * @param html The notes, as HTML or as older plain text.
 * @returns The text, with list items as "- " lines and at most one empty line between blocks.
 * @example
 * notesText("<p>Cache</p><ul><li>TTL &amp; size</li></ul>"); // "Cache\n- TTL & size"
 */
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
