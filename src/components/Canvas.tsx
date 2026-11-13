"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

export default function Canvas({ onReady }: { onReady: (api: ExcalidrawImperativeAPI) => void }) {
  return <Excalidraw excalidrawAPI={onReady} />;
}
