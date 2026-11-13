"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useTheme } from "next-themes";
import "@excalidraw/excalidraw/index.css";

export default function Canvas({ onReady }: { onReady: (api: ExcalidrawImperativeAPI) => void }) {
  const { resolvedTheme } = useTheme();
  return <Excalidraw excalidrawAPI={onReady} theme={resolvedTheme === "dark" ? "dark" : "light"} />;
}
