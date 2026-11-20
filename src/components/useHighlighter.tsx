"use client";

import { Highlighter, NotebookPen, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  addHighlight,
  changeHighlightNote,
  listHighlights,
  removeHighlight,
} from "@/lib/browser/api";
import { rangeFor } from "@/lib/browser/page-text";
import { keys } from "@/lib/browser/query-keys";
import type { Highlight as SavedHighlight } from "@/lib/store/notebook";
import { findPassage } from "@/lib/text-anchor";

// The names of the highlight styles in globals.css.
const PLAIN = "charrette-highlight";
const NOTED = "charrette-highlight-note";
const FOCUS = "charrette-highlight-focus";
const FOCUS_MS = 1500;
// The note box of a highlight: the left edge of its center, so it stays on the screen, and its
// space below the click.
const NOTE_BOX = { minLeft: 150, below: 12 };

type Point = { x: number; y: number };

const NONE: SavedHighlight[] = [];

// The text for a change that the notebook did not save. The server gives the reason, if it has one.
const reason = (thrown: unknown) =>
  (thrown as Error).message || "The notebook did not save the change.";

function textNodes(root: Node): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node as Text);
  return nodes;
}

// Count the characters from the start of the root to a point in it.
// This is the same count as the text of all text nodes, so it agrees with textNodes.
function offsetIn(root: Node, node: Node, offset: number): number {
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(node, offset);
  return range.toString().length;
}

/**
 * Highlights and notes on the text inside one element, saved in the notebook for one page.
 * Put `root` and `handlers` on the element, and show `overlay` once on the page. The learning
 * pages and the kata text use it.
 * @returns The root ref, the event handlers, the highlights of the page, the functions that change
 * them, the page title, and the overlay to show.
 */
export function useHighlighter({ page, getTitle }: { page: string; getTitle?: () => string }) {
  const root = useRef<HTMLDivElement>(null);
  const client = useQueryClient();
  // The list of each page has its own key, so a new page starts with its own highlights.
  // The highlights load again at each visit to a page, and no copy stays for a later visit.
  // A note is text that the person changes, so an old copy must not show.
  const list = useQuery({
    queryKey: keys.highlights(page),
    queryFn: () => listHighlights(page),
    gcTime: 0,
  });
  const highlights = list.data ?? NONE;
  // Change the list of the page that this render shows. A slow answer of the server cannot change
  // the list of a different page.
  const setHighlights = (update: (items: SavedHighlight[]) => SavedHighlight[]) =>
    client.setQueryData<SavedHighlight[]>(keys.highlights(page), (items = NONE) => update(items));
  // The position of each highlight on the page now, after the last paint.
  const located = useRef(new Map<string, [number, number]>());
  const [selection, setSelection] = useState<Point | null>(null);
  const [open, setOpen] = useState<{ id: string; at: Point } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  // The time of the load failure that the person closed. A later failure shows again.
  const [closedAt, setClosedAt] = useState(0);
  const loadFailed = list.isError && list.errorUpdatedAt !== closedAt;
  const message = error || (loadFailed ? "Cannot load the highlights of this page." : "");

  // Draw the highlights. They are not elements, so React does not see them.
  const paint = useCallback(() => {
    if (!root.current || typeof CSS === "undefined" || !("highlights" in CSS)) return;
    const nodes = textNodes(root.current);
    const pageText = nodes.map((node) => node.data).join("");
    const plain = new Highlight();
    const noted = new Highlight();
    located.current.clear();
    for (const item of highlights) {
      const start = findPassage(pageText, item.text, item.start);
      if (start === -1) continue;
      const range = rangeFor(nodes, start, start + item.text.length);
      if (!range) continue;
      (item.note.trim() ? noted : plain).add(range);
      located.current.set(item.id, [start, start + item.text.length]);
    }
    CSS.highlights.set(PLAIN, plain);
    CSS.highlights.set(NOTED, noted);
  }, [highlights]);

  // Draw again when the content changes, for example when a diagram finishes loading.
  useEffect(() => {
    paint();
    if (!root.current) return;
    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    });
    observer.observe(root.current, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [paint]);

  useEffect(
    () => () => {
      CSS.highlights?.delete(PLAIN);
      CSS.highlights?.delete(NOTED);
      CSS.highlights?.delete(FOCUS);
    },
    [],
  );

  // Close the menus when the page scrolls, because the text moves. Escape also closes them.
  useEffect(() => {
    const close = () => {
      setSelection(null);
      setOpen(null);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    // A press outside the note closes it. The text box saves the note when it loses focus.
    const onPress = (event: PointerEvent) => {
      if (!dialog.current?.contains(event.target as Node)) setOpen(null);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPress);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPress);
    };
  }, []);

  const openHighlight = useCallback(
    (id: string, at: Point) => {
      setNote(highlights.find((item) => item.id === id)?.note ?? "");
      setOpen({ id, at });
    },
    [highlights],
  );

  // After a selection, show the highlight menu. After a click on a highlight, show its note.
  const onPointerUp = useCallback(
    (event: React.MouseEvent | React.KeyboardEvent) => {
      const current = window.getSelection();
      if (!root.current || !current?.anchorNode || !root.current.contains(current.anchorNode)) {
        setSelection(null);
        return;
      }
      if (!current.isCollapsed) {
        const box = current.getRangeAt(0).getBoundingClientRect();
        setSelection({ x: box.left + box.width / 2, y: box.top });
        setOpen(null);
        return;
      }
      setSelection(null);
      if (!("clientX" in event)) return;
      const offset = offsetIn(root.current, current.anchorNode, current.anchorOffset);
      for (const [id, [start, end]] of located.current) {
        if (offset >= start && offset <= end) {
          openHighlight(id, { x: event.clientX, y: event.clientY });
          return;
        }
      }
      setOpen(null);
    },
    [openHighlight],
  );

  const pageTitle = () =>
    getTitle?.() || root.current?.querySelector("h1")?.textContent?.trim() || document.title;

  async function create(withNote: boolean) {
    const current = window.getSelection();
    if (!root.current || !current || current.isCollapsed) return;
    const range = current.getRangeAt(0);
    const box = range.getBoundingClientRect();
    const raw = range.toString();
    const text = raw.trim();
    if (!text) return;
    // Do not keep the spaces at the two ends of the selection.
    const start =
      offsetIn(root.current, range.startContainer, range.startOffset) +
      (raw.length - raw.trimStart().length);
    const title = pageTitle();
    current.removeAllRanges();
    setSelection(null);
    setError("");
    try {
      const highlight = await addHighlight({ page, title, text, start, note: "" });
      setHighlights((items) => [...items, highlight]);
      if (withNote) {
        setNote("");
        setOpen({ id: highlight.id, at: { x: box.left + box.width / 2, y: box.bottom } });
      }
    } catch (thrown) {
      setError(reason(thrown));
    }
  }

  async function changeNote(id: string, next: string) {
    const saved = highlights.find((item) => item.id === id);
    if (!saved || saved.note === next) return;
    try {
      const updated = await changeHighlightNote(id, next);
      setHighlights((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch (thrown) {
      setError(reason(thrown));
    }
  }

  async function remove(id: string) {
    if (open?.id === id) setOpen(null);
    try {
      await removeHighlight(id);
      setHighlights((items) => items.filter((item) => item.id !== id));
    } catch (thrown) {
      setError(reason(thrown));
    }
  }

  // Scroll to a highlight and mark it for a moment.
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function show(id: string) {
    const position = located.current.get(id);
    if (!root.current || !position || !("highlights" in CSS)) {
      setError("This passage is not on the page now. The text of the page changed.");
      return;
    }
    const range = rangeFor(textNodes(root.current), position[0], position[1]);
    if (!range) return;
    range.startContainer.parentElement?.scrollIntoView({ block: "center", behavior: "smooth" });
    CSS.highlights.set(FOCUS, new Highlight(range));
    if (focusTimer.current) clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(() => CSS.highlights.delete(FOCUS), FOCUS_MS);
  }

  const highlightsInOrder = [...highlights].sort((a, b) => a.start - b.start);

  const overlay = (
    <>
      {selection && (
        <div
          className="fixed z-50 flex -translate-x-1/2 -translate-y-full gap-1 pb-1.5 [&>button]:shadow-float"
          style={{ left: selection.x, top: selection.y }}
        >
          <Button
            variant="noShadow"
            size="xs"
            className="hover:bg-foreground hover:text-background"
            // Keep the selection when the user presses the button.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => create(false)}
          >
            <Highlighter /> Highlight
          </Button>
          <Button
            variant="noShadow"
            size="xs"
            className="hover:bg-foreground hover:text-background"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => create(true)}
          >
            <NotebookPen /> Add a note
          </Button>
        </div>
      )}

      {open && (
        <dialog
          open
          ref={dialog}
          aria-label="Highlight"
          className="fixed z-50 m-0 w-72 text-foreground -translate-x-1/2 space-y-2 rounded-base border border-border bg-secondary-background p-3 text-sm shadow-float"
          style={{ left: Math.max(NOTE_BOX.minLeft, open.at.x), top: open.at.y + NOTE_BOX.below }}
        >
          <Textarea
            aria-label="Note for this highlight"
            placeholder="Write a note for this passage."
            rows={3}
            // oxlint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onBlur={() => changeNote(open.id, note)}
          />
          <div className="flex justify-end gap-1">
            <Button size="xs" variant="neutral" onClick={() => remove(open.id)}>
              <Trash2 /> Remove
            </Button>
            <Button size="xs" onClick={() => setOpen(null)}>
              Done
            </Button>
          </div>
        </dialog>
      )}

      {message && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-base border border-border bg-secondary-background px-3 py-2 text-sm shadow-float"
        >
          {message}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => {
              setError("");
              setClosedAt(list.errorUpdatedAt);
            }}
          >
            Close
          </button>
        </div>
      )}
    </>
  );

  return {
    root,
    handlers: { onMouseUp: onPointerUp, onKeyUp: onPointerUp },
    highlights: highlightsInOrder,
    // Add highlights that were made somewhere else, for example by a migration.
    addHighlights: (items: SavedHighlight[]) => setHighlights((current) => [...current, ...items]),
    show,
    changeNote,
    remove,
    pageTitle,
    overlay,
  };
}
