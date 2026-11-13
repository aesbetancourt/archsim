"use client";

import { Highlighter } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Kata } from "@/lib/katas";

// The highlighted ranges of each text block, as [start, end] positions in the text.
type Marks = Record<string, [number, number][]>;

const storageKey = (kataId: string) => `archsim:highlights:${kataId}`;

// Join ranges that touch or overlap.
function merge(ranges: [number, number][]): [number, number][] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const result: [number, number][] = [];
  for (const [start, end] of sorted) {
    const last = result[result.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else result.push([start, end]);
  }
  return result;
}

// Count the characters from the start of a block to a point in it.
function offsetIn(block: Element, node: Node, offset: number): number {
  const range = document.createRange();
  range.selectNodeContents(block);
  range.setEnd(node, offset);
  return range.toString().length;
}

function Block({ id, text, ranges, onRemove }: { id: string; text: string; ranges: [number, number][]; onRemove: (index: number) => void }) {
  const parts: React.ReactNode[] = [];
  let position = 0;
  ranges.forEach(([start, end], index) => {
    if (start > position) parts.push(text.slice(position, start));
    parts.push(
      <mark
        key={index}
        title="Click to remove this highlight"
        className="cursor-pointer rounded-sm bg-[#ffe45c] px-0.5 text-black"
        onClick={() => onRemove(index)}
      >
        {text.slice(start, end)}
      </mark>,
    );
    position = end;
  });
  if (position < text.length) parts.push(text.slice(position));
  return <span data-block={id}>{parts}</span>;
}

// The text of a kata. The user can select text and highlight it.
// Highlights are saved in this browser, for each kata.
export default function ProblemText({ kata }: { kata: Kata }) {
  const root = useRef<HTMLDivElement>(null);
  const [marks, setMarks] = useState<Marks>({});
  const [button, setButton] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey(kata.id));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setMarks(JSON.parse(saved));
    } catch {
      // Storage is not available. Start with no highlights.
    }
  }, [kata.id]);

  const update = useCallback(
    (next: Marks) => {
      setMarks(next);
      try {
        localStorage.setItem(storageKey(kata.id), JSON.stringify(next));
      } catch {
        // Storage is not available. The highlights last for this page only.
      }
    },
    [kata.id],
  );

  // Show the highlight button above a selection in the kata text.
  const onSelect = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !root.current?.contains(selection.anchorNode)) {
      setButton(null);
      return;
    }
    const box = selection.getRangeAt(0).getBoundingClientRect();
    setButton({ x: box.left + box.width / 2, y: box.top });
  }, []);

  // Hide the button when the panel scrolls, because the selection moves.
  useEffect(() => {
    const hide = () => setButton(null);
    window.addEventListener("scroll", hide, true);
    return () => window.removeEventListener("scroll", hide, true);
  }, []);

  function highlight() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !root.current) return;
    const range = selection.getRangeAt(0);
    const next: Marks = { ...marks };
    // A selection can cover more than one block. Mark the selected part of each one.
    for (const block of root.current.querySelectorAll("[data-block]")) {
      if (!range.intersectsNode(block)) continue;
      const length = block.textContent?.length ?? 0;
      const start = block.contains(range.startContainer) ? offsetIn(block, range.startContainer, range.startOffset) : 0;
      const end = block.contains(range.endContainer) ? offsetIn(block, range.endContainer, range.endOffset) : length;
      if (end > start) {
        const id = block.getAttribute("data-block")!;
        next[id] = merge([...(next[id] ?? []), [start, end]]);
      }
    }
    update(next);
    selection.removeAllRanges();
    setButton(null);
  }

  const block = (id: string, text: string) => (
    <Block
      id={id}
      text={text}
      ranges={marks[id] ?? []}
      onRemove={(index) => update({ ...marks, [id]: (marks[id] ?? []).filter((_, position) => position !== index) })}
    />
  );
  const total = Object.values(marks).reduce((sum, ranges) => sum + ranges.length, 0);

  return (
    <div ref={root} className="space-y-3" onMouseUp={onSelect} onKeyUp={onSelect}>
      <p>{block("context", kata.context)}</p>
      {kata.details?.map((paragraph, index) => <p key={index}>{block(`detail-${index}`, paragraph)}</p>)}
      {kata.users && (
        <p>
          <span className="font-medium">Users:</span> {block("users", kata.users)}
        </p>
      )}
      {kata.requirements.length > 0 && (
        <div>
          <h2 className="font-medium">Requirements</h2>
          <ul className="list-disc pl-5 text-muted-foreground">
            {kata.requirements.map((item, index) => (
              <li key={index}>{block(`requirement-${index}`, item)}</li>
            ))}
          </ul>
        </div>
      )}
      {kata.constraints.length > 0 && (
        <div>
          <h2 className="font-medium">Constraints</h2>
          <ul className="list-disc pl-5 text-muted-foreground">
            {kata.constraints.map((item, index) => (
              <li key={index}>{block(`constraint-${index}`, item)}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Highlighter className="size-3" /> Select text to highlight it.
        </span>
        {total > 0 && (
          <button type="button" className="underline" onClick={() => update({})}>
            Remove all {total} highlights
          </button>
        )}
      </p>

      {button && (
        <Button
          size="xs"
          className="fixed z-50 -translate-x-1/2 -translate-y-full hover:translate-x-[-50%] hover:translate-y-[-100%] hover:shadow-shadow"
          style={{ left: button.x, top: button.y - 6 }}
          // Keep the selection when the user presses the button.
          onMouseDown={(event) => event.preventDefault()}
          onClick={highlight}
        >
          <Highlighter /> Highlight
        </Button>
      )}
    </div>
  );
}
