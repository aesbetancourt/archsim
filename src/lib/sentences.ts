/** A part of a text, from the start position to the end position (not included). */
export type Span = { start: number; end: number };

// The longest part that the read-aloud player sends in one request.
const MAX_LENGTH = 600;

const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });

// Cut a long part at the last space before the limit, so no word is cut.
function cut(text: string, span: Span, max: number): Span[] {
  const parts: Span[] = [];
  let start = span.start;
  while (span.end - start > max) {
    const space = text.lastIndexOf(" ", start + max);
    const end = space > start ? space : start + max;
    parts.push({ start, end });
    start = end;
    while (text[start] === " ") start += 1;
  }
  parts.push({ start, end: span.end });
  return parts;
}

/**
 * Split a text into the sentences to read aloud, without the spaces around them.
 * A part with no letter or digit, for example "—", is not a sentence.
 * @param text The text to split.
 * @param max The longest part, in characters. A longer sentence is cut at a space.
 * The default is 600.
 * @returns The positions of the parts, in the order of the text.
 * @example
 * splitSentences("Hello there. Bye."); // [{ start: 0, end: 12 }, { start: 13, end: 17 }]
 */
export function splitSentences(text: string, max = MAX_LENGTH): Span[] {
  const spans: Span[] = [];
  for (const { segment, index } of segmenter.segment(text)) {
    const start = index + (segment.length - segment.trimStart().length);
    const end = index + segment.trimEnd().length;
    if (end <= start || !/[\p{L}\p{N}]/u.test(segment)) continue;
    spans.push(...cut(text, { start, end }, max));
  }
  return spans;
}

// An aside in parentheses that starts a sentence or follows a space, for example "(see below)".
// A parenthesis right after a letter is notation, for example "O(log n)", so it stays.
const ASIDE = /(^|\s)\([^()]*\)/g;

/**
 * Remove the asides in parentheses, so the read-aloud player does not read them.
 * Notation such as "O(log n)" stays.
 * @param text The text to read aloud.
 * @returns The text with no asides, with single spaces, and with no spaces at the ends.
 * @example
 * withoutAsides("A cache (see below) is O(1) fast."); // "A cache is O(1) fast."
 */
export function withoutAsides(text: string): string {
  let result = text;
  for (let before = ""; before !== result;) {
    before = result;
    result = result.replace(ASIDE, "");
  }
  return result.replace(/\s+/g, " ").trim();
}
