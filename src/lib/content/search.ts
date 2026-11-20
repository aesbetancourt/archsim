// The search of the app (⌘K). This file has no server code, so the browser can rank the results.

const searchKinds = [
  "Page",
  "Lesson",
  "Section",
  "Case",
  "Kata",
  "Term",
  "Question",
  "Cheatsheet",
  "Note",
] as const;
type SearchKind = (typeof searchKinds)[number];

export type SearchItem = {
  kind: SearchKind;
  title: string;
  // A short second line: the lesson of a section, the definition of a term.
  subtitle?: string;
  href: string;
  // More words that find the item, but that the result does not show.
  keywords?: string;
};

// Remove a plural or "-y" end from a search word, so "retry" also finds "retries", and
// "caches" also finds "cache". Short words stay as they are.
export function stem(word: string): string {
  if (word.length <= 4) return word;
  return word.replace(/(ies|es|s|y)$/, "");
}

const searchWords = (query: string) => query.toLowerCase().split(/\s+/).filter(Boolean).map(stem);

// A larger number ranks higher. A kind that people look for more often gets a small extra.
const kindBonus: Record<SearchKind, number> = {
  Page: 3,
  Lesson: 3,
  Case: 3,
  Kata: 2,
  Cheatsheet: 2,
  Term: 2,
  Section: 1,
  Note: 1,
  Question: 0,
};

// The score of an item for the search words, or 0 when a word is not in the item.
function scoreItem(item: SearchItem, words: string[]): number {
  if (words.length === 0) return 0;
  const title = item.title.toLowerCase();
  const subtitle = (item.subtitle ?? "").toLowerCase();
  const keywords = (item.keywords ?? "").toLowerCase();
  let score = 0;
  for (const word of words) {
    if (title.startsWith(word)) score += 10;
    else if (new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(title))
      score += 8;
    else if (title.includes(word)) score += 6;
    else if (keywords.includes(word)) score += 3;
    else if (subtitle.includes(word)) score += 2;
    else return 0;
  }
  // A short title that matches is closer to what the person typed.
  return score + kindBonus[item.kind] - Math.min(title.length / 40, 2);
}

// The best results, in order. Items with the same score keep the order of the index.
export function search(items: SearchItem[], query: string, limit = 40): SearchItem[] {
  const words = searchWords(query);
  if (words.length === 0) return [];
  return items
    .map((item, index) => ({ item, index, score: scoreItem(item, words) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.item);
}
