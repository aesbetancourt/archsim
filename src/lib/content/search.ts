import { escapeRegExp } from "es-toolkit";

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

/** One item that the search can find: a page, a lesson, a term, a note, or other content. */
export type SearchItem = {
  kind: SearchKind;
  title: string;
  // A short second line: the lesson of a section, the definition of a term.
  subtitle?: string;
  href: string;
  // More words that find the item, but that the result does not show.
  keywords?: string;
};

// A word of this length or shorter is not stemmed.
const SHORT_WORD = 4;

/**
 * Remove a plural or "-y" end from a search word, so "retry" also finds "retries", and
 * "caches" also finds "cache". Short words stay as they are.
 * @param word A lowercase search word.
 * @returns The word without its end.
 * @example
 * stem("caches"); // "cach"
 * stem("api"); // "api"
 */
export function stem(word: string): string {
  if (word.length <= SHORT_WORD) return word;
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

// The points for one search word, by where the item has it. A larger number ranks higher.
const POINTS = { titleStart: 10, titleWord: 8, inTitle: 6, keyword: 3, subtitle: 2 };
// A short title ranks a little higher. Each step of this many characters takes away one point, up
// to two points.
const TITLE_STEP = 40;
const MAX_TITLE_PENALTY = 2;

// The score of an item for the search words, or 0 when a word is not in the item.
function scoreItem(item: SearchItem, words: string[]): number {
  if (words.length === 0) return 0;
  const title = item.title.toLowerCase();
  const subtitle = (item.subtitle ?? "").toLowerCase();
  const keywords = (item.keywords ?? "").toLowerCase();
  let score = 0;
  for (const word of words) {
    if (title.startsWith(word)) score += POINTS.titleStart;
    else if (new RegExp(`\\b${escapeRegExp(word)}`).test(title)) score += POINTS.titleWord;
    else if (title.includes(word)) score += POINTS.inTitle;
    else if (keywords.includes(word)) score += POINTS.keyword;
    else if (subtitle.includes(word)) score += POINTS.subtitle;
    else return 0;
  }
  // A short title that matches is closer to what the person typed.
  return score + kindBonus[item.kind] - Math.min(title.length / TITLE_STEP, MAX_TITLE_PENALTY);
}

/**
 * Find the best results for a query, in order.
 * Items with the same score keep the order of the index.
 * An item must have each word of the query to be a result.
 * @param items The search index.
 * @param query The text that the person typed.
 * @param limit The maximum number of results.
 * @returns The items that match, best first. An empty query gives no results.
 * @example
 * search(index, "event sourcing"); // the items with both words, best first
 * search(index, "cache", 5); // the five best items for "cache"
 */
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
