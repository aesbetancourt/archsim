"use client";

import { MIME_TYPES, serializeLibraryAsJSON, viewportCoordsToSceneCoords } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI, LibraryItems } from "@excalidraw/excalidraw/types";
import { Blocks, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BlockIcon from "@/components/BlockIcon";
import { elementsFor, HEIGHT, sizeOf, WIDTH } from "@/lib/block-elements";
import { type Block, blockGroups, blocks } from "@/lib/blocks";

const HIDDEN_KEY = "archsim:blocks-hidden";
// The time the pointer must stay on a piece before its description shows.
const TIP_DELAY_MS = 2000;
const TIP_WIDTH = 320;

type Tip = { block: Block; left: number; top: number };

const ALL_NAMES = blocks.map((block) => block.name).join(" ");

// Load the hand-drawn font of the canvas. Excalidraw measures a label when a piece is made.
// Without the font, the measure is too small and the ends of a long label are cut off.
function loadCanvasFont(): Promise<unknown> {
  return document.fonts.load("16px Excalifont", ALL_NAMES).catch(() => undefined);
}

type Props = {
  getApi: () => ExcalidrawImperativeAPI | null;
  // Called when the palette opens or closes, because the canvas changes its size.
  onToggle: () => void;
};

// The standard pieces of a design. Drag a piece to the canvas, or click it.
export default function BlockPalette({ getApi, onToggle }: Props) {
  const [open, setOpen] = useState(true);
  // The group on view. A search shows the matches from all groups.
  const [groupId, setGroupId] = useState(blockGroups[0].id);
  const [query, setQuery] = useState("");
  const [tip, setTip] = useState<Tip | null>(null);
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideTip = () => {
    if (tipTimer.current) clearTimeout(tipTimer.current);
    tipTimer.current = null;
    setTip(null);
  };

  // Show the description below the piece after the pointer stays on it.
  const planTip = (block: Block, target: HTMLElement) => {
    hideTip();
    tipTimer.current = setTimeout(() => {
      const box = target.getBoundingClientRect();
      const left = Math.max(8, Math.min(box.left, window.innerWidth - TIP_WIDTH - 8));
      setTip({ block, left, top: box.bottom + 6 });
    }, TIP_DELAY_MS);
  };

  useEffect(() => () => {
    if (tipTimer.current) clearTimeout(tipTimer.current);
  }, []);
  // The number of pieces added with a click. It sets the position of the next one.
  const clicks = useRef(0);

  useEffect(() => {
    try {
      // The saved state is known only in the browser, after the first render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(HIDDEN_KEY) === "1") setOpen(false);
    } catch {
      // The browser can refuse access to storage. The palette stays open.
    }
  }, []);

  useEffect(() => {
    onToggle();
  }, [open, onToggle]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(HIDDEN_KEY, next ? "0" : "1");
    } catch {
      // The state is not saved. The palette still works.
    }
  };

  // Add the piece in the center of the visible canvas.
  const add = async (block: Block) => {
    const api = getApi();
    if (!api) return;
    await loadCanvasFont();
    const state = api.getAppState();
    const center = viewportCoordsToSceneCoords(
      { clientX: state.offsetLeft + state.width / 2, clientY: state.offsetTop + state.height / 2 },
      state,
    );
    const size = sizeOf(block);
    const single = size.width === WIDTH && size.height === HEIGHT;
    // Put single pieces in rows of three, so a new piece does not cover the last one.
    const index = single ? clicks.current++ % 9 : 0;
    const x = center.x - size.width / 2 + (single ? ((index % 3) - 1) * (WIDTH + 40) : 0);
    const y = center.y - size.height / 2 + (single ? (Math.floor(index / 3) - 1) * (HEIGHT + 50) : 0);
    const elements = elementsFor(block, x, y);
    const current = api.getSceneElements();
    // A boundary goes below the other shapes, so the pieces in it stay easy to select.
    api.updateScene({ elements: block.shape === "boundary" ? [...elements, ...current] : [...current, ...elements] });
  };

  // Excalidraw accepts a dropped library item and puts it at the pointer.
  const dragStart = (event: React.DragEvent, block: Block) => {
    const items = [
      { id: block.id, status: "unpublished", created: 0, name: block.name, elements: elementsFor(block, 0, 0) },
    ] as unknown as LibraryItems;
    event.dataTransfer.setData(MIME_TYPES.excalidrawlib, serializeLibraryAsJSON(items));
    event.dataTransfer.effectAllowed = "copy";
  };

  const words = query.trim().toLowerCase();
  const shown = words
    ? blocks.filter((block) => `${block.name} ${block.does}`.toLowerCase().includes(words))
    : blocks.filter((block) => block.group === groupId);
  const colorOf = (block: Block) => blockGroups.find((group) => group.id === block.group)?.color ?? "#ffffff";

  return (
    <div className="border-b-2 border-border bg-secondary-background text-xs" onPointerEnter={loadCanvasFont}>
      <div className="flex items-center gap-3 px-3 py-1.5">
        <button type="button" onClick={toggle} aria-expanded={open} className="flex shrink-0 items-center gap-1.5 font-medium">
          <Blocks className="size-4" /> Building blocks
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Find in ${blocks.length} pieces`}
            aria-label="Find a piece"
            className="w-44 rounded-base border-2 border-border bg-background px-2 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        )}
        {open && <span className="hidden text-muted-foreground lg:inline">Drag a piece to the canvas, or click it.</span>}
        <a href="/learn/building-blocks" target="_blank" rel="noreferrer" className="ml-auto shrink-0 text-primary hover:underline">
          What each piece costs
        </a>
      </div>
      {open && (
        <div className="space-y-1.5 px-3 pb-2">
          <div role="tablist" aria-label="Groups of pieces" className="flex flex-wrap gap-x-1 gap-y-1">
            {blockGroups.map((group) => {
              const selected = !words && group.id === groupId;
              return (
                <button
                  key={group.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setGroupId(group.id);
                    setQuery("");
                  }}
                  className={`flex items-center gap-1.5 rounded-base border-2 px-2 py-0.5 ${
                    selected ? "border-border bg-background font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span style={{ backgroundColor: group.color }} className="size-2.5 rounded-full border border-border" />
                  {group.title}
                </button>
              );
            })}
          </div>
          <div className="flex min-h-7 flex-wrap items-center gap-1.5">
            {shown.map((block) => (
              <button
                key={block.id}
                type="button"
                draggable
                onDragStart={(event) => {
                  hideTip();
                  dragStart(event, block);
                }}
                onClick={() => {
                  hideTip();
                  void add(block);
                }}
                onMouseEnter={(event) => planTip(block, event.currentTarget)}
                onMouseLeave={hideTip}
                onFocus={(event) => planTip(block, event.currentTarget)}
                onBlur={hideTip}
                aria-describedby={tip?.block.id === block.id ? "block-tip" : undefined}
                style={{ backgroundColor: colorOf(block) }}
                className={`flex cursor-grab items-center gap-1 border-2 border-border px-2 py-0.5 font-medium text-black active:cursor-grabbing ${
                  block.shape === "actor" || block.shape === "person" ? "rounded-full" : block.shape === "module" ? "rounded-none" : "rounded-base"
                } ${block.shape === "external" || block.shape === "boundary" ? "border-dashed" : ""}`}
              >
                <BlockIcon shape={block.shape} />
                {block.name}
              </button>
            ))}
            {shown.length === 0 && <span className="text-muted-foreground">No piece has these words. Draw a shape and name it.</span>}
          </div>
        </div>
      )}
      {tip && (
        <div
          id="block-tip"
          role="tooltip"
          style={{ left: tip.left, top: tip.top, width: TIP_WIDTH }}
          className="pointer-events-none fixed z-50 space-y-1.5 rounded-base border-2 border-border bg-background p-3 text-xs leading-relaxed shadow-shadow"
        >
          <p className="text-sm font-medium">{tip.block.name}</p>
          <p>{tip.block.does}</p>
          <p>
            <span className="font-medium">It costs you: </span>
            <span className="text-muted-foreground">{tip.block.cost}</span>
          </p>
          <p>
            <span className="font-medium">Use it when: </span>
            <span className="text-muted-foreground">{tip.block.useWhen}</span>
          </p>
        </div>
      )}
    </div>
  );
}
