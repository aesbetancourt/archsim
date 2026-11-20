"use client";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { ArrowLeft, NotebookPen, PenTool } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import HelpChat from "@/components/HelpChat";
import LinkButton from "@/components/LinkButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Board } from "@/lib/store/boards";
import { notesText } from "@/lib/notes-html";
import { slimElements } from "@/lib/ai/scene";
import { saveBoard } from "@/lib/browser/api";
import { sceneVersion } from "@/lib/browser/scene-version";
import { type Autosave, useAutosave } from "@/lib/browser/use-autosave";

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

/**
 * The editor of a board: a title, a canvas, and a notepad.
 * It saves each change after a short delay.
 * @returns The title bar, the canvas or the notepad, and the save status.
 */
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
  // The version of the drawing at the last change. See sceneVersion.
  const lastVersion = useRef(-1);

  const save = useCallback(
    async (autosave: Autosave) => {
      setStatus("saving");
      try {
        await saveBoard(board.id, {
          ...latest.current,
          scene: {
            elements: api.current?.getSceneElements() ?? board.scene.elements,
            files: api.current?.getFiles() ?? board.scene.files,
          },
        });
        // A newer change can arrive during the request. Then a save is already planned.
        setStatus(autosave.isPlanned() ? "pending" : "saved");
      } catch {
        setStatus("error");
      }
    },
    [board.id, board.scene],
  );
  // The board saves at once when the user leaves the page with a planned save.
  const autosave = useAutosave(save, SAVE_DELAY_MS);

  // Plan a save a short time after the last change.
  const changed = useCallback(() => {
    setStatus("pending");
    autosave.schedule();
  }, [autosave]);

  // Excalidraw reports each pointer move. Plan a save only when the drawing changed.
  const onSceneChange = useCallback(
    (elements: readonly { version: number }[]) => {
      const version = sceneVersion(elements);
      if (lastVersion.current === -1) {
        lastVersion.current = version;
        return;
      }
      if (version !== lastVersion.current) {
        lastVersion.current = version;
        changed();
      }
    },
    [changed],
  );

  return (
    <main className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col bg-card">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <LinkButton
            variant="ghost"
            size="sm"
            href="/scratchpad"
            aria-label="All boards"
            title="All boards"
          >
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
              variant="tab"
              size="sm"
              onClick={() => setView("diagram")}
            >
              <PenTool /> Diagram
            </Button>
            <Button
              role="tab"
              aria-selected={view === "notes"}
              variant="tab"
              size="sm"
              onClick={() => setView("notes")}
            >
              <NotebookPen /> Notes
            </Button>
          </div>
          <output className="ml-auto text-xs text-muted-foreground">{statusText[status]}</output>
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
          elements: slimElements(
            api.current?.getSceneElements() ?? (board.scene.elements as object[]),
          ),
        })}
      />
    </main>
  );
}
