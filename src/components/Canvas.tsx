"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import { useTheme } from "next-themes";
import { useCallback, useRef } from "react";
import BlockPalette from "@/components/BlockPalette";
import "@excalidraw/excalidraw/index.css";

type Props = {
  onReady: (api: ExcalidrawImperativeAPI) => void;
  // A saved drawing to open.
  initialData?: { elements: unknown[]; files: Record<string, unknown> };
  // Called on each change of the drawing, and also on pointer moves.
  onChange?: (elements: readonly { version: number }[]) => void;
};

export default function Canvas({ onReady, initialData, onChange }: Props) {
  const { resolvedTheme } = useTheme();
  const api = useRef<ExcalidrawImperativeAPI | null>(null);
  const getApi = useCallback(() => api.current, []);
  // The canvas must measure its position again after the palette changes its height.
  const refresh = useCallback(() => requestAnimationFrame(() => api.current?.refresh()), []);

  return (
    <div className="flex h-full flex-col">
      <BlockPalette getApi={getApi} onToggle={refresh} />
      <div className="min-h-0 flex-1">
        <Excalidraw
          excalidrawAPI={(instance) => {
            api.current = instance;
            onReady(instance);
          }}
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          initialData={
            initialData
              ? ({ elements: initialData.elements, files: initialData.files, scrollToContent: true } as ExcalidrawInitialDataState)
              : undefined
          }
          onChange={onChange}
        />
      </div>
    </div>
  );
}
