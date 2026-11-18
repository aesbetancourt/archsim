"use client";

import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AutosaveNotes, { putJson } from "@/components/AutosaveNotes";
import ConfirmButton from "@/components/ConfirmButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NoteDoc } from "@/lib/notebook";
import { notesText } from "@/lib/notes";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

// The general notes of the notebook: a list of notes with titles. A click opens one note.
// Without initial notes, the component gets them from the server.
export default function GeneralNotes({
  initial,
  compact = false,
}: {
  initial?: NoteDoc[];
  compact?: boolean;
}) {
  const [documents, setDocuments] = useState<NoteDoc[] | null>(initial ?? null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) return;
    let current = true;
    fetch("/api/notebook/notes")
      .then((response) => (response.ok ? response.json() : []))
      .then((items: NoteDoc[]) => current && setDocuments(items))
      .catch(() => current && setDocuments([]));
    return () => {
      current = false;
    };
  }, [initial]);

  async function create() {
    setError("");
    const response = await fetch("/api/notebook/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    if (!response.ok) {
      setError("The note was not created. Try again.");
      return;
    }
    const created = (await response.json()) as NoteDoc;
    setDocuments((items) => [...(items ?? []), created]);
    setOpenId(created.id);
  }

  const update = (id: string, change: Partial<NoteDoc>) =>
    setDocuments((items) =>
      (items ?? []).map((item) => (item.id === id ? { ...item, ...change } : item)),
    );

  if (documents === null) return <p className="p-4 text-muted-foreground">Loading the notes.</p>;

  const opened = documents.find((item) => item.id === openId);
  if (opened) {
    return (
      <OpenNote
        key={opened.id}
        document={opened}
        compact={compact}
        onBack={() => setOpenId(null)}
        onChange={(change) => update(opened.id, change)}
        onDeleted={() => {
          setDocuments((items) => (items ?? []).filter((item) => item.id !== opened.id));
          setOpenId(null);
        }}
      />
    );
  }

  // The most recently changed note is first.
  const sorted = [...documents].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b-2 px-3 py-2">
        <p className="text-muted-foreground">
          Notes for each topic, not for one page. For example: questions, or a summary.
        </p>
        <Button size="sm" onClick={create} className="shrink-0">
          <Plus /> New note
        </Button>
      </div>
      {error && (
        <p role="alert" className="px-3 pt-2">
          {error}
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {sorted.length === 0 ? (
          <p className="text-muted-foreground">No general notes yet. Click New note.</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((item) => {
              const preview = notesText(item.html).split("\n")[0];
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(item.id)}
                    className="w-full cursor-pointer rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-left hover:bg-main hover:text-main-foreground"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <FileText className="size-4 shrink-0" aria-hidden />
                      {item.title}
                    </span>
                    <span className="block truncate text-xs opacity-80">
                      {dateFormat.format(new Date(item.updatedAt))}
                      {preview && ` · ${preview}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function OpenNote({
  document,
  compact,
  onBack,
  onChange,
  onDeleted,
}: {
  document: NoteDoc;
  compact: boolean;
  onBack: () => void;
  onChange: (change: Partial<NoteDoc>) => void;
  onDeleted: () => void;
}) {
  const url = `/api/notebook/notes/${document.id}`;
  const [title, setTitle] = useState(document.title);
  // The newest values, for a save of the other field.
  const latest = useRef({ title: document.title, html: document.html });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-1 border-b-2 px-2 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label="All general notes"
          title="All general notes"
          onClick={onBack}
        >
          <ArrowLeft />
        </Button>
        <Input
          aria-label="Title of the note"
          className="h-8 min-w-0 flex-1 font-medium"
          value={title}
          // oxlint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={document.html === ""}
          onChange={(event) => {
            setTitle(event.target.value);
            latest.current.title = event.target.value;
          }}
          onBlur={() => {
            if (title === document.title) return;
            onChange({ title: title.trim() || "Untitled note" });
            void putJson(url, latest.current).catch(() => undefined);
          }}
        />
        <ConfirmButton
          label={<Trash2 />}
          ariaLabel="Delete this note"
          size="icon"
          variant="ghost"
          title="Delete this note?"
          description={`The note "${document.title}" is removed from the notebook. You cannot undo this.`}
          confirmLabel="Delete"
          endpoint={url}
          onDone={onDeleted}
        />
      </div>
      <div className="min-h-0 flex-1">
        <AutosaveNotes
          label={`Note: ${document.title}`}
          placeholder="Write here. Use headings and lists to keep the topic in order."
          compact={compact}
          initialHtml={document.html}
          onChange={(html) => {
            latest.current.html = html;
            onChange({ html, updatedAt: new Date().toISOString() });
          }}
          save={(html) => putJson(url, { ...latest.current, html })}
        />
      </div>
    </div>
  );
}
