import { splitSentences, withoutAsides } from "@/lib/sentences";

// The text of a page, for the read-aloud player and the highlighter: its sentences, its sections,
// and positions in it. This code reads the page and can scroll it. It has no React.

// The pause is the silence before the sentence, in milliseconds.
export type Sentence = { text: string; range: Range; pause: number };
export type Section = { title: string; element: HTMLElement };
export type Point = { node: Node; offset: number };

// The elements that hold text to read, and the elements to skip.
// Tables are skipped: a table read cell by cell is hard to follow by ear.
export const BLOCKS = "h1,h2,h3,h4,p,li,dt,dd,blockquote,figcaption";
export const SKIP = "pre,nav,table,button,svg,script,style,textarea,input,select,[data-read-skip]";
// A click on these elements does its own action. It does not move the reading.
export const INTERACTIVE = "a,button,input,textarea,select,label,summary,[role=button]";
// The silence before a heading and before a list item, in milliseconds.
// A new section and a new item then sound new.
const HEADING_PAUSE = 800;
const ITEM_PAUSE = 400;
// The space at the top and bottom of the window that the current sentence must not go into.
const TOP_MARGIN = 72;
const BOTTOM_MARGIN = 120;

// Make a DOM range for the characters from start to end of the root text.
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

// Find the sentences in the visible text of the root, in reading order.
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
    // Wait before a heading and before a list item. A list item can hold its text in a paragraph.
    let pause = block.matches("h1,h2,h3,h4")
      ? HEADING_PAUSE
      : block.matches("li, li > p:first-child")
        ? ITEM_PAUSE
        : 0;
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

// The middle of the first line of text in a block, in window pixels. The padding of a heading and a
// tall line do not move it, so the "Read from here" button is level with the words.
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

// The sections of the page: each visible level-2 heading outside the skipped parts.
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

// The section of a sentence: the last heading before it, or -1 before the first heading.
// A heading that is no longer in the same page as the sentence cannot be compared. Skip it.
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

// A sentence is gone when React replaced its text, for example after a new page or a new render.
export const isGone = (sentence: Sentence) =>
  !sentence.range.startContainer.isConnected || !sentence.range.endContainer.isConnected;

// The text position under a point of the window.
export function caretAt(x: number, y: number): Point | null {
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(x, y);
    return position ? { node: position.offsetNode, offset: position.offset } : null;
  }
  const range = document.caretRangeFromPoint?.(x, y);
  return range ? { node: range.startContainer, offset: range.startOffset } : null;
}

// The first sentence that contains the point or comes after it.
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

// The first sentence that is in the window now. Play starts there, so you can scroll to a place.
export function firstVisible(sentences: Sentence[]): number {
  const index = sentences.findIndex((sentence) => {
    const rect = sentence.range.getBoundingClientRect();
    return rect.bottom > TOP_MARGIN && rect.top < window.innerHeight;
  });
  return Math.max(index, 0);
}

// Scroll to a sentence when it is outside the part of the window that the player leaves free.
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
