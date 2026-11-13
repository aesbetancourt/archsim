"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import { useTheme } from "next-themes";
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
  return (
    <Excalidraw
      excalidrawAPI={onReady}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      initialData={
        initialData
          ? ({ elements: initialData.elements, files: initialData.files, scrollToContent: true } as ExcalidrawInitialDataState)
          : undefined
      }
      onChange={onChange}
    />
  );
}
