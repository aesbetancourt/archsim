"use client";

import { Highlighter } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useHighlighter } from "@/components/useHighlighter";
import type { Kata } from "@/lib/content/katas";
import type { Highlight } from "@/lib/store/notebook";
import { addHighlight } from "@/lib/browser/api";

// Before the notebook, kata highlights were in the browser: [start, end] in each text block.
const oldKey = (kataId: string) => `charrette:highlights:${kataId}`;

// The text of a kata. The user can select text to highlight it and add a note.
// The highlights are saved in the notebook, like the highlights of the lessons.
export default function ProblemText({ kata }: { kata: Kata }) {
  const page = `/kata/${kata.id}`;
  const { root, handlers, highlights, addHighlights, overlay } = useHighlighter({
    page,
    getTitle: () => `${kata.title} (kata)`,
  });

  // Move the old highlights of this browser to the notebook, one time.
  const migrated = useRef("");
  useEffect(() => {
    if (migrated.current === kata.id || !root.current) return;
    migrated.current = kata.id;
    let saved: unknown;
    try {
      saved = JSON.parse(localStorage.getItem(oldKey(kata.id)) ?? "null");
    } catch {
      return;
    }
    if (!saved || typeof saved !== "object") return;
    const element = root.current;
    const items: { blockId: string; range: [number, number]; text: string; start: number }[] = [];
    for (const [blockId, ranges] of Object.entries(saved as Record<string, unknown>)) {
      const block = element.querySelector(`[data-block="${blockId}"]`);
      if (!block?.textContent || !Array.isArray(ranges)) continue;
      // The position of the block in the text of the kata.
      const before = document.createRange();
      before.selectNodeContents(element);
      before.setEndBefore(block);
      const offset = before.toString().length;
      for (const range of ranges) {
        if (!Array.isArray(range) || range.length !== 2) continue;
        const [start, end] = range as [number, number];
        const text = block.textContent.slice(start, end).trim();
        if (text) items.push({ blockId, range: [start, end], text, start: offset + start });
      }
    }
    if (items.length === 0) {
      localStorage.removeItem(oldKey(kata.id));
      return;
    }
    Promise.allSettled(
      items.map(async (item) => {
        return addHighlight({
          page,
          title: `${kata.title} (kata)`,
          text: item.text,
          start: item.start,
          note: "",
        });
      }),
    ).then((results) => {
      addHighlights(
        results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : [])),
      );
      // Keep only the highlights that did not move, so the next visit tries them again.
      const left: Record<string, [number, number][]> = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled") return;
        const { blockId, range } = items[index];
        (left[blockId] ??= []).push(range);
      });
      try {
        if (Object.keys(left).length === 0) localStorage.removeItem(oldKey(kata.id));
        else localStorage.setItem(oldKey(kata.id), JSON.stringify(left));
      } catch {
        // Storage is not available. The highlights are in the notebook now.
      }
    });
  }, [kata.id, kata.title, page, root, addHighlights]);

  const block = (id: string, text: string) => <span data-block={id}>{text}</span>;

  return (
    <>
      {/* These handlers only read the text selection. They do not start an action. */}
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div ref={root} className="space-y-3" {...handlers}>
        <p>{block("context", kata.context)}</p>
        {kata.details?.map((paragraph, index) => (
          <p key={index}>{block(`detail-${index}`, paragraph)}</p>
        ))}
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
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Highlighter className="size-3" /> Select text to highlight it.
        </span>
        {highlights.length > 0 && (
          <Link href="/notebook" className="underline">
            {highlights.length} {highlights.length === 1 ? "highlight" : "highlights"} in the
            notebook
          </Link>
        )}
      </p>
      {overlay}
    </>
  );
}
