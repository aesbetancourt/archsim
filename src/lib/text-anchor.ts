/**
 * Find a saved passage in the text of a page.
 * The text of a page can change, for example when a lesson is edited or a filter hides a part.
 * Then the saved position is wrong, so the function uses the occurrence nearest to that position.
 * @param pageText The text of the page now.
 * @param text The text of the saved passage.
 * @param start The saved start position of the passage.
 * @returns The start position of the passage, or -1 when the page does not contain it.
 * @example
 * findPassage("a cache, then a cache", "cache", 15); // 16
 */
export function findPassage(pageText: string, text: string, start: number): number {
  if (!text) return -1;
  if (pageText.startsWith(text, start)) return start;
  let best = -1;
  for (let at = pageText.indexOf(text); at !== -1; at = pageText.indexOf(text, at + 1)) {
    if (best === -1 || Math.abs(at - start) < Math.abs(best - start)) best = at;
  }
  return best;
}
