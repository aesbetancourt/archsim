// Small text helpers for the server and the browser.

// A count with its word: "1 bookmark", "2 bookmarks".
export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

// Make a text safe to put in HTML.
export const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
