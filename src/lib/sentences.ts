// A part of a text, from the start position to the end position (not included).
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

// Split a text into the sentences to read aloud, without the spaces around them.
// A part with no letter or digit, for example "—", is not a sentence.
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
