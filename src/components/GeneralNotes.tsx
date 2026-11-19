"use client";

import { ArrowLeft, FileText, Plus, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AutosaveNotes, { putJson } from "@/components/AutosaveNotes";
import ConfirmButton from "@/components/ConfirmButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InsightsStatus } from "@/lib/insights-job";
import type { NoteDoc } from "@/lib/notebook";
import { notesText } from "@/lib/notes";

// How often the page asks for the state of the insights job, in milliseconds.
const POLL_MS = 3_000;

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

// The general notes of the notebook: a list of notes with titles. A click opens one note.
// Without initial notes, the component gets them from the server.
export default function GeneralNotes({
  initial,
  compact = false,
  insights = false,
  openAsPage = false,
}: {
  initial?: NoteDoc[];
  compact?: boolean;
  // Show the button that writes an insights document from the whole notebook.
  insights?: boolean;
  // Open a note on its own page, with a full-size editor, and not in this box.
  openAsPage?: boolean;
}) {
  const router = useRouter();
  const [documents, setDocuments] = useState<NoteDoc[] | null>(initial ?? null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [writing, setWriting] = useState(false);

  const open = (id: string) => (openAsPage ? router.push(`/notebook/notes/${id}`) : setOpenId(id));

  // The AI writes the insights in the background on the server. The page asks for the state when
  // it opens, and again every few seconds while the job runs. Then the new note shows in the list.
  const [check, setCheck] = useState(0);
  const waiting = useRef(false);

  useEffect(() => {
    if (!insights) return;
    let current = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      try {
        const state = (await (await fetch("/api/notebook/insights")).json()) as InsightsStatus;
        if (!current) return;
        if (state.status === "running") {
          waiting.current = true;
          setWriting(true);
          timer = setTimeout(poll, POLL_MS);
          return;
        }
        setWriting(false);
        if (state.status === "failed") setError(state.error);
        if (waiting.current) {
          waiting.current = false;
          const items = (await (await fetch("/api/notebook/notes")).json()) as NoteDoc[];
          if (current) setDocuments(items);
        }
      } catch {
        // The server did not answer. Ask again later.
        if (current) timer = setTimeout(poll, POLL_MS);
      }
    }
    void poll();
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [insights, check]);

  async function createInsights() {
    setError("");
    try {
      const response = await fetch("/api/notebook/insights", { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? "The insights document was not started. Try again.");
        return;
      }
      waiting.current = true;
      setWriting(true);
      // Start to ask for the state of the new job.
      setCheck((value) => value + 1);
    } catch {
      setError("The insights document was not started. Try again.");
    }
  }

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
    open(created.id);
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
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <p className="text-muted-foreground">
          Notes for each topic, not for one page. For example: questions, or a summary.
        </p>
        <div className="flex shrink-0 gap-2">
          {insights && (
            <Button
              size="sm"
              variant="neutral"
              onClick={createInsights}
              disabled={writing}
              title="The AI reads all your bookmarks, highlights, and notes, and writes a study document."
            >
              <Sparkles className={writing ? "animate-pulse" : undefined} />
              {writing ? "Writing the insights…" : "Create insights"}
            </Button>
          )}
          <Button size="sm" onClick={create}>
            <Plus /> New note
          </Button>
        </div>
      </div>
      {writing && (
        <p role="status" className="px-3 pt-2 text-muted-foreground">
          The AI writes the insights in the background. You can leave or reload this page. The
          document shows here when it is ready.
        </p>
      )}
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
                    onClick={() => open(item.id)}
                    className="w-full cursor-pointer rounded-base border border-border bg-secondary-background px-3 py-2 text-left hover:bg-main hover:text-main-foreground"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {item.kind === "insights" ? (
                        <Sparkles className="size-4 shrink-0" aria-hidden />
                      ) : (
                        <FileText className="size-4 shrink-0" aria-hidden />
                      )}
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

// One general note: its title and its editor. The sidebar and the note page use it.
export function OpenNote({
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
      <div className="flex items-center gap-1 border-b px-2 py-2">
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
