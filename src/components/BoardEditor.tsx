"use client";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { ArrowLeft, NotebookPen, PenTool } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import HelpChat from "@/components/HelpChat";
import LinkButton from "@/components/LinkButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Board } from "@/lib/boards";
import { notesText } from "@/lib/notes";
import { slimElements } from "@/lib/scene";

const Canvas = dynamic(() => import("./Canvas"), { ssr: false });
const NotesEditor = dynamic(() => import("./NotesEditor"), { ssr: false });

const SAVE_DELAY_MS = 1200;

type Status = "saved" | "pending" | "saving" | "error";

const statusText: Record<Status, string> = {
  saved: "All changes saved",
  pending: "Changes not saved yet",
  saving: "Saving",
  error: "The save failed. Change something to try again.",
};

export default function BoardEditor({ board }: { board: Board }) {
  const api = useRef<ExcalidrawImperativeAPI | null>(null);
  const [title, setTitle] = useState(board.title);
  // The large area shows the canvas or the notepad. A board starts on the canvas.
  const [view, setView] = useState<"notes" | "diagram">("diagram");
  // The notes as HTML. The notepad opens with them each time the user selects its tab.
  const [notes, setNotes] = useState(board.notes);
  const [status, setStatus] = useState<Status>("saved");
  // The newest values, for a save that starts after a delay.
  const latest = useRef({ title: board.title, notes: board.notes });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A number that changes when the drawing changes.
  const sceneVersion = useRef(-1);

  const save = useCallback(async () => {
    timer.current = null;
    setStatus("saving");
    try {
      const response = await fetch(`/api/boards/${board.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          ...latest.current,
          scene: {
            elements: api.current?.getSceneElements() ?? board.scene.elements,
            files: api.current?.getFiles() ?? board.scene.files,
          },
        }),
      });
      if (!response.ok) throw new Error();
      // A newer change can arrive during the request. Then a save is already planned.
      setStatus(timer.current ? "pending" : "saved");
    } catch {
      setStatus("error");
    }
  }, [board.id, board.scene]);

  // Plan a save a short time after the last change.
  const changed = useCallback(() => {
    setStatus("pending");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, SAVE_DELAY_MS);
  }, [save]);

  // Save immediately when the user leaves the page with a planned save.
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        void save();
      }
    };
  }, [save]);

  // Excalidraw reports each pointer move. Plan a save only when the drawing changed.
  const onSceneChange = useCallback(
    (elements: readonly { version: number }[]) => {
      const version = elements.reduce((sum, element) => sum + element.version, elements.length);
      if (sceneVersion.current === -1) {
        sceneVersion.current = version;
        return;
      }
      if (version !== sceneVersion.current) {
        sceneVersion.current = version;
        changed();
      }
    },
    [changed],
  );

  return (
    <main className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col bg-card">
        <div className="flex items-center gap-2 border-b-2 px-3 py-2">
          <LinkButton variant="ghost" size="sm" href="/scratchpad" aria-label="All boards" title="All boards">
            <ArrowLeft />
          </LinkButton>
          <Input
            aria-label="Title of the board"
            className="h-8 w-64 font-medium"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              latest.current.title = event.target.value;
              changed();
            }}
          />
          <div role="tablist" aria-label="Work area" className="flex items-center gap-2">
            <Button
              role="tab"
              aria-selected={view === "diagram"}
              variant={view === "diagram" ? "noShadow" : "ghost"}
              size="sm"
              onClick={() => setView("diagram")}
            >
              <PenTool /> Diagram
            </Button>
            <Button
              role="tab"
              aria-selected={view === "notes"}
              variant={view === "notes" ? "noShadow" : "ghost"}
              size="sm"
              onClick={() => setView("notes")}
            >
              <NotebookPen /> Notes
            </Button>
          </div>
          <span className="ml-auto text-xs text-muted-foreground" role="status">
            {statusText[status]}
          </span>
        </div>
        <div className="relative min-h-0 flex-1">
          {/* The canvas stays loaded under the notepad, so the drawing is kept. */}
          <Canvas
            onReady={(instance) => (api.current = instance)}
            initialData={{ elements: board.scene.elements, files: board.scene.files }}
            onChange={onSceneChange}
          />
          {view === "notes" && (
            <div className="absolute inset-0 z-20 bg-card">
              <NotesEditor
                label="Notes for this board"
                initialHtml={notes}
                onHtmlChange={(html) => {
                  setNotes(html);
                  latest.current.notes = html;
                  changed();
                }}
              />
            </div>
          )}
        </div>
      </div>
      <HelpChat
        intro="Ask about your notes, your diagram, or any architecture topic."
        getContext={() => ({
          kind: "board",
          title: latest.current.title,
          notes: notesText(latest.current.notes),
          elements: slimElements(api.current?.getSceneElements() ?? (board.scene.elements as object[])),
        })}
      />
    </main>
  );
}
