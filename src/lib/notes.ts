// The notes of a kata are saved in the browser as HTML, for each kata.
export const notesKey = (kataId: string) => `archsim:notes:${kataId}`;

// Notes are HTML. Older notes are plain text. Convert those to paragraphs.
export function toNotesHtml(saved: string): string {
  if (!saved || saved.trimStart().startsWith("<")) return saved;
  const escape = (line: string) => line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return saved.split("\n").map((line) => `<p>${escape(line)}</p>`).join("");
}

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

const entities: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

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
