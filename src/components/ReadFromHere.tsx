"use client";

import { Play } from "lucide-react";
import { type RefObject, useEffect, useEffectEvent, useRef, useState } from "react";
import { BLOCKS, SKIP, firstLineMiddle } from "@/lib/browser/page-text";

// The distance from the left edge of the text to the button.
const GUTTER = 26;

// The small play button next to the block of text under the pointer. A click starts the reading
// at that block. It is a part of the read-aloud player.
export default function ReadFromHere({
  root,
  page,
  onRead,
}: {
  root: RefObject<HTMLDivElement | null>;
  page: string;
  onRead: (block: Element) => void;
}) {
  // The position of the button on the screen.
  const [place, setPlace] = useState<{ top: number; left: number } | null>(null);
  // The block under the pointer.
  const hovered = useRef<Element | null>(null);
  const button = useRef<HTMLButtonElement>(null);

  // Show the "Read from here" button next to the block under the pointer.
  const onMove = useEffectEvent((event: MouseEvent) => {
    const element = root.current;
    const block = event.target instanceof Element ? event.target.closest(BLOCKS) : null;
    if (!element || !block || block === hovered.current || !element.contains(block)) return;
    const skip = block.closest(SKIP);
    if ((skip && element.contains(skip)) || !block.textContent?.trim()) return;
    hovered.current = block;
    // Put the button in the margin to the left of the text column, level with the first line.
    const column = block.closest("main") ?? element;
    const left =
      column.getBoundingClientRect().left +
      parseFloat(getComputedStyle(column).paddingLeft) -
      GUTTER;
    setPlace({ left, top: firstLineMiddle(block) });
  });

  function clear() {
    hovered.current = null;
    setPlace(null);
  }

  const hide = useEffectEvent((event?: Event) => {
    // The pointer can move from the text to the button, or straight to the icon inside it.
    // Keep the button then.
    const next = event instanceof MouseEvent ? event.relatedTarget : null;
    if (next instanceof Node && button.current?.contains(next)) return;
    clear();
  });

  useEffect(() => {
    const element = root.current;
    const onScroll = () => hide();
    element?.addEventListener("mousemove", onMove, { passive: true });
    element?.addEventListener("mouseleave", hide);
    // The button has a fixed place on the screen, so it goes away when the page scrolls.
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      element?.removeEventListener("mousemove", onMove);
      element?.removeEventListener("mouseleave", hide);
      window.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, [root]);

  // A new page has new blocks.
  useEffect(() => {
    const frame = requestAnimationFrame(() => hide());
    return () => cancelAnimationFrame(frame);
  }, [page]);

  if (!place) return null;
  return (
    <button
      ref={button}
      type="button"
      // The section menu and Alt+R do the same for the keyboard.
      tabIndex={-1}
      aria-label="Read from here"
      title="Read from here"
      onMouseLeave={(event) => {
        // The pointer can go to something that is not a node, for example the window.
        const next = event.relatedTarget;
        if (!(next instanceof Node) || !root.current?.contains(next)) clear();
      }}
      onClick={() => {
        if (hovered.current) onRead(hovered.current);
      }}
      style={{ top: place.top, left: place.left }}
      className="fixed z-30 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-main text-main-foreground opacity-70 transition-opacity hover:opacity-100 shadow-float"
    >
      <Play className="size-3" aria-hidden />
    </button>
  );
}
