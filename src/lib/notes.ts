// The notes of a kata are saved in the browser as HTML, for each kata.
export const notesKey = (kataId: string) => `archsim:notes:${kataId}`;

// Read the saved notes. Older notes are plain text. Convert those to paragraphs.
export function loadNotesHtml(kataId: string): string {
  let saved = "";
  try {
    saved = localStorage.getItem(notesKey(kataId)) ?? "";
  } catch {
    // Storage is not available. Start with empty notes.
  }
  if (!saved || saved.trimStart().startsWith("<")) return saved;
  const escape = (line: string) => line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return saved.split("\n").map((line) => `<p>${escape(line)}</p>`).join("");
}

export function saveNotesHtml(kataId: string, html: string): void {
  try {
    localStorage.setItem(notesKey(kataId), html);
  } catch {
    // Storage is not available. The notes last for this page only.
  }
}

// Convert the saved HTML to plain text, for the help chat and for the saved attempt.
export function notesText(html: string): string {
  const withBreaks = html
    .replace(/<li[^>]*>/g, "- ")
    .replace(/<\/(p|h[1-6]|li|blockquote)>/g, "\n")
    .replace(/<br\s*\/?>/g, "\n");
  const area = document.createElement("textarea");
  area.innerHTML = withBreaks.replace(/<[^>]+>/g, "");
  return area.value.replace(/\n{3,}/g, "\n\n").trim();
}
