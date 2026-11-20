// Small text helpers for the server and the browser.

/**
 * Write a count with its word, and add "s" to the word when the count is not 1.
 * @param count The number of things.
 * @param word The word for one thing. It must have a regular plural.
 * @returns The count and the word.
 * @example
 * plural(2, "bookmark"); // "2 bookmarks"
 */
export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * Make a text safe to put in HTML. The function escapes &, <, >, and ".
 * @param value The text to escape.
 * @returns The escaped text.
 * @example
 * escapeHtml('<a href="x">'); // "&lt;a href=&quot;x&quot;&gt;"
 */
export const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
