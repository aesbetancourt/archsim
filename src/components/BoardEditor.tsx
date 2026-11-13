"use client";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { ArrowLeft, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import HelpChat from "@/components/HelpChat";
import StyleLessonBody from "@/components/StyleLessonBody";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Board } from "@/lib/boards";
import { characteristics, styleLessons } from "@/lib/learn";
import { slimElements } from "@/lib/scene";

const Canvas = dynamic(() => import("./Canvas"), { ssr: false });

const SAVE_DELAY_MS = 1200;

type Status = "saved" | "pending" | "saving" | "error";

const statusText: Record<Status, string> = {
  saved: "All changes saved",
  pending: "Changes not saved yet",
  saving: "Saving",
  error: "The save failed. Change something to try again.",
};

function Reference({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-base border-2 border-border bg-secondary-background px-3 py-2 font-medium">
        {title}
        <ChevronDown className="size-4 transition-transform group-data-[panel-open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2 px-1">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export default function BoardEditor({ board }: { board: Board }) {
  const api = useRef<ExcalidrawImperativeAPI | null>(null);
  const [title, setTitle] = useState(board.title);
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
      <aside className="flex w-[24rem] shrink-0 flex-col border-r-2 bg-card text-sm leading-relaxed">
        <div className="relative flex-1 space-y-5 overflow-y-auto p-5">
          <Link href="/scratchpad" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> All boards
          </Link>

          <div className="space-y-1.5">
            <Label htmlFor="board-title">Title</Label>
            <Input
              id="board-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                latest.current.title = event.target.value;
                changed();
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="board-notes">Notes</Label>
            <Textarea
              id="board-notes"
              className="min-h-64"
              placeholder="Requirements, assumptions, decisions, open questions…"
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                latest.current.notes = event.target.value;
                changed();
              }}
            />
          </div>

          <div className="space-y-2">
            <h2 className="font-medium">Reference</h2>
            <Reference title="Architecture characteristics">
              <dl className="space-y-2">
                {characteristics.map((item) => (
                  <div key={item.name}>
                    <dt className="font-medium">{item.name}</dt>
                    <dd className="text-muted-foreground">
                      {item.meaning} Signal: {item.signal}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reference>
            <Reference title="Architecture styles">
              <ul className="space-y-2">
                {styleLessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Dialog>
                      <DialogTrigger className="text-left font-medium text-primary hover:underline">
                        {lesson.name}
                      </DialogTrigger>
                      <DialogContent className="max-h-[85vh] overflow-y-auto text-sm leading-relaxed sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{lesson.name}</DialogTitle>
                          <DialogDescription>{lesson.idea}</DialogDescription>
                        </DialogHeader>
                        <StyleLessonBody lesson={lesson} />
                      </DialogContent>
                    </Dialog>
                    <p className="text-muted-foreground">{lesson.idea}</p>
                  </li>
                ))}
              </ul>
            </Reference>
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              <a href="/learn" target="_blank" className="text-primary hover:underline">
                Learn pages ↗
              </a>
              <a href="/glossary" target="_blank" className="text-primary hover:underline">
                Glossary ↗
              </a>
            </p>
          </div>
        </div>
        <p className="border-t-2 px-5 py-3 text-muted-foreground" role="status">
          {statusText[status]}
        </p>
      </aside>
      <div className="min-w-0 flex-1 bg-card">
        <Canvas
          onReady={(instance) => (api.current = instance)}
          initialData={{ elements: board.scene.elements, files: board.scene.files }}
          onChange={onSceneChange}
        />
      </div>
      <HelpChat
        intro="Ask about your notes, your diagram, or any architecture topic."
        getContext={() => ({
          kind: "board",
          title: latest.current.title,
          notes: latest.current.notes,
          elements: slimElements(api.current?.getSceneElements() ?? (board.scene.elements as object[])),
        })}
      />
    </main>
  );
}
