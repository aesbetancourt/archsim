import { splitSentences, withoutAsides } from "@/lib/sentences";

// The text of a page, for the read-aloud player and the highlighter: its sentences, its sections,
// and positions in it. This code reads the page and can scroll it. It has no React.

/**
 * One sentence to read aloud, with its place on the page. The pause is the silence before the
 * sentence, in milliseconds.
 */
export type Sentence = { text: string; range: Range; pause: number };
/** A section of the page: a level-2 heading and its title. */
export type Section = { title: string; element: HTMLElement };
/** A text position on the page: a node and an offset in it. */
export type Point = { node: Node; offset: number };

/** The elements that hold text to read. */
export const BLOCKS = "h1,h2,h3,h4,p,li,dt,dd,blockquote,figcaption";
/** The elements to skip. Tables are skipped: a table read cell by cell is hard to follow by ear. */
export const SKIP = "pre,nav,table,button,svg,script,style,textarea,input,select,[data-read-skip]";
/** The elements that do their own action on a click. A click on them does not move the reading. */
export const INTERACTIVE = "a,button,input,textarea,select,label,summary,[role=button]";
// The silence before a heading and before a list item, in milliseconds.
// A new section and a new item then sound new.
const HEADING_PAUSE = 800;
const ITEM_PAUSE = 400;

// The silence before the first sentence of a block. A list item can hold its text in a paragraph.
function pauseBefore(block: Element): number {
  if (block.matches("h1,h2,h3,h4")) return HEADING_PAUSE;
  if (block.matches("li, li > p:first-child")) return ITEM_PAUSE;
  return 0;
}
// The space at the top and bottom of the window that the current sentence must not go into.
const TOP_MARGIN = 72;
const BOTTOM_MARGIN = 120;

/**
 * Make a DOM range for the characters from start to end of the root text.
 * @param nodes The text nodes of the root, in order.
 * @param start The position of the first character in the joined text.
 * @param end The position after the last character in the joined text.
 * @returns The range, or undefined when the positions are outside the text.
 * @example
 * const range = rangeFor(nodes, start, start + item.text.length);
 */
export function rangeFor(nodes: Text[], start: number, end: number): Range | undefined {
  const range = document.createRange();
  let position = 0;
  let started = false;
  for (const node of nodes) {
    const next = position + node.data.length;
    if (!started && start < next) {
      range.setStart(node, start - position);
      started = true;
    }
    if (started && end <= next) {
      range.setEnd(node, end - position);
      return range;
    }
    position = next;
  }
  return undefined;
}

/**
 * Find the sentences in the visible text of the root, in reading order. The asides in
 * parentheses are not read.
 * @param root The element that holds the text of the page.
 * @returns The sentences to read.
 * @example
 * sentences.current = collectSentences(root.current);
 */
export function collectSentences(root: HTMLElement): Sentence[] {
  const groups: { block: Element; nodes: Text[] }[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent) continue;
    const skip = parent.closest(SKIP);
    if (skip && root.contains(skip)) continue;
    const block = parent.closest(BLOCKS);
    if (!block || !root.contains(block)) continue;
    const last = groups.at(-1);
    if (last?.block === block) last.nodes.push(node as Text);
    else groups.push({ block, nodes: [node as Text] });
  }

  const sentences: Sentence[] = [];
  for (const { block, nodes } of groups) {
    if (!block.checkVisibility()) continue;
    const text = nodes.map((node) => node.data).join("");
    let pause = pauseBefore(block);
    for (const span of splitSentences(text)) {
      const range = rangeFor(nodes, span.start, span.end);
      // Do not read the asides in parentheses. Skip a sentence that is only an aside.
      const spoken = withoutAsides(text.slice(span.start, span.end));
      if (!range || !/[\p{L}\p{N}]/u.test(spoken)) continue;
      sentences.push({ text: spoken, range, pause });
      // Only the first sentence of the block waits.
      pause = 0;
    }
  }
  return sentences;
}

/**
 * Get the middle of the first line of text in a block, in window pixels. The padding of a
 * heading and a tall line do not move it, so the "Read from here" button is level with the words.
 * @param block The element that holds the text.
 * @returns The vertical position, in window pixels.
 * @example
 * setPlace({ left, top: firstLineMiddle(block) });
 */
export function firstLineMiddle(block: Element): number {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const line = [...range.getClientRects()].find((rect) => rect.height > 0);
    if (line) return line.top + line.height / 2;
  }
  const rect = block.getBoundingClientRect();
  return rect.top + rect.height / 2;
}

/**
 * Find the sections of the page: each visible level-2 heading outside the skipped parts.
 * @param root The element that holds the text of the page, or null before it shows.
 * @returns The sections, in page order. Empty when there is no root.
 * @example
 * sectionList.current = collectSections(root.current);
 */
export function collectSections(root: HTMLElement | null): Section[] {
  if (!root) return [];
  return [...root.querySelectorAll<HTMLElement>("h2")]
    .filter((heading) => {
      const skip = heading.closest(SKIP);
      return !(skip && root.contains(skip)) && heading.checkVisibility();
    })
    .map((element) => ({ title: element.textContent?.trim() ?? "", element }))
    .filter((section) => section.title);
}

/**
 * Find the section of a sentence: the last heading before it. A heading that is no longer in
 * the same page as the sentence cannot be compared, so it is skipped.
 * @param sections The sections of the page.
 * @param range The range of the sentence.
 * @returns The index of the section, or -1 before the first heading.
 * @example
 * setSection(sectionOf(sectionList.current, range));
 */
export function sectionOf(sections: Section[], range: Range): number {
  let found = -1;
  sections.forEach((section, index) => {
    try {
      if (range.comparePoint(section.element, 0) <= 0) found = index;
    } catch {
      // The page changed under the sentence or the heading.
    }
  });
  return found;
}

/**
 * Find out if a sentence is gone. A sentence is gone when React replaced its text, for example
 * after a new page or a new render.
 * @param sentence The sentence to check.
 * @returns True when the text of the sentence is no longer on the page.
 * @example
 * if (isGone(sentence)) sentences.current = collectSentences(root.current);
 */
export const isGone = (sentence: Sentence) =>
  !sentence.range.startContainer.isConnected || !sentence.range.endContainer.isConnected;

/**
 * Find the text position under a point of the window.
 * @param x The horizontal position, in window pixels.
 * @param y The vertical position, in window pixels.
 * @returns The text position, or null when there is no text under the point.
 * @example
 * const point = caretAt(event.clientX, event.clientY);
 */
export function caretAt(x: number, y: number): Point | null {
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(x, y);
    return position ? { node: position.offsetNode, offset: position.offset } : null;
  }
  const range = document.caretRangeFromPoint?.(x, y);
  return range ? { node: range.startContainer, offset: range.startOffset } : null;
}

/**
 * Find the first sentence that contains the point or comes after it.
 * @param sentences The sentences of the page.
 * @param point The text position.
 * @returns The index of the sentence. 0 when no sentence matches.
 * @example
 * void playAt(sentenceAt(sentences.current, point));
 */
export function sentenceAt(sentences: Sentence[], point: Point): number {
  const index = sentences.findIndex((sentence) => {
    try {
      return sentence.range.comparePoint(point.node, point.offset) <= 0;
    } catch {
      return false;
    }
  });
  return Math.max(index, 0);
}

/**
 * Find the first sentence that is in the window now. Play starts there, so you can scroll to a
 * place.
 * @param sentences The sentences of the page.
 * @returns The index of the sentence. 0 when no sentence is in the window.
 * @example
 * void playAt(firstVisible(sentences.current));
 */
export function firstVisible(sentences: Sentence[]): number {
  const index = sentences.findIndex((sentence) => {
    const rect = sentence.range.getBoundingClientRect();
    return rect.bottom > TOP_MARGIN && rect.top < window.innerHeight;
  });
  return Math.max(index, 0);
}

/**
 * Scroll to a sentence when it is outside the part of the window that the player leaves free.
 * @param range The range of the sentence.
 * @example
 * keepInView(range);
 */
export function keepInView(range: Range): void {
  const rect = range.getBoundingClientRect();
  if (rect.top < TOP_MARGIN || rect.bottom > window.innerHeight - BOTTOM_MARGIN) {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    range.startContainer.parentElement?.scrollIntoView({
      block: "center",
      behavior: still ? "auto" : "smooth",
    });
  }
}
