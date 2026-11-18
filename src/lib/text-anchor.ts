// Find a saved passage in the text of a page. Return its start position, or -1.
// The text of a page can change, for example when a lesson is edited or a filter hides a part.
// Then the saved position is wrong. Use the occurrence of the text nearest to that position.
export function findPassage(pageText: string, text: string, start: number): number {
  if (!text) return -1;
  if (pageText.startsWith(text, start)) return start;
  let best = -1;
  for (let at = pageText.indexOf(text); at !== -1; at = pageText.indexOf(text, at + 1)) {
    if (best === -1 || Math.abs(at - start) < Math.abs(best - start)) best = at;
  }
  return best;
}
