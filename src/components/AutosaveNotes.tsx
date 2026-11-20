"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const NotesEditor = dynamic(() => import("./NotesEditor"), { ssr: false });

const SAVE_DELAY_MS = 1000;

type Status = "saved" | "pending" | "error";

const statusText: Record<Status, string> = {
  saved: "All changes saved",
  pending: "Changes not saved yet",
  error: "The save failed. Change something to try again.",
};

type Props = {
  initialHtml: string;
  // Send the notes to the server. Throw if the save fails.
  save: (html: string) => Promise<void>;
  // The editor reads initialHtml only when it starts. onChange lets a parent keep the newest
  // notes, so the editor starts with them again after it closes and opens.
  onChange?: (html: string) => void;
  label: string;
  placeholder: string;
  compact?: boolean;
};

// A notes editor that saves each change after a short delay.
export default function AutosaveNotes({
  initialHtml,
  save,
  onChange,
  label,
  placeholder,
  compact,
}: Props) {
  const [status, setStatus] = useState<Status>("saved");
  const latest = useRef(initialHtml);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The newest save function. A parent can give a new one at each render.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  async function flush() {
    timer.current = null;
    try {
      await saveRef.current(latest.current);
      setStatus(timer.current ? "pending" : "saved");
    } catch {
      setStatus("error");
    }
  }
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });

  // Save immediately when the editor closes with a planned save.
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        void flushRef.current();
      }
    },
    [],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1">
        <NotesEditor
          label={label}
          placeholder={placeholder}
          compact={compact}
          initialHtml={initialHtml}
          onHtmlChange={(html) => {
            latest.current = html;
            onChange?.(html);
            setStatus("pending");
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => flushRef.current(), SAVE_DELAY_MS);
          }}
        />
      </div>
      <output className="border-t px-3 py-1 text-xs text-muted-foreground">
        {statusText[status]}
      </output>
    </div>
  );
}
