"use client";

import { ArrowRight, Highlighter } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import GeneralNotes from "@/components/GeneralNotes";
import HighlightItem from "@/components/HighlightItem";
import { Card } from "@/components/ui/card";
import type { Highlight, Notebook, PageNote } from "@/lib/notebook";
import { notesText } from "@/lib/notes";

type PageGroup = { page: string; title: string; note?: PageNote; items: Highlight[]; last: string };

// Put the notes and the highlights of each page together. The most recently used page is first.
function byPage(pages: PageNote[], highlights: Highlight[]): PageGroup[] {
  const groups = new Map<string, PageGroup>();
  const group = (page: string, title: string) => {
    const found = groups.get(page) ?? { page, title, items: [], last: "" };
    groups.set(page, found);
    return found;
  };
  for (const note of pages) {
    const found = group(note.page, note.title);
    found.note = note;
    if (note.updatedAt > found.last) found.last = note.updatedAt;
  }
  for (const item of highlights) {
    const found = group(item.page, item.title);
    found.items.push(item);
    if (item.createdAt > found.last) found.last = item.createdAt;
  }
  // In a page, show the passages in reading order.
  for (const found of groups.values()) found.items.sort((a, b) => a.start - b.start);
  return [...groups.values()].sort((a, b) => b.last.localeCompare(a.last));
}

// All of the notebook: the general notes, and the notes and highlights of each page.
export default function NotebookView({ notebook }: { notebook: Notebook }) {
  const [highlights, setHighlights] = useState(notebook.highlights);
  const [error, setError] = useState("");

  async function changeNote(id: string, note: string) {
    setError("");
    const response = await fetch(`/api/notebook/highlights/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    if (!response.ok) {
      setError("The note was not saved. Try again.");
      return;
    }
    const updated = (await response.json()) as Highlight;
    setHighlights((items) => items.map((item) => (item.id === id ? updated : item)));
  }

  async function remove(id: string) {
    setError("");
    const response = await fetch(`/api/notebook/highlights/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("The highlight was not removed. Try again.");
      return;
    }
    setHighlights((items) => items.filter((item) => item.id !== id));
  }

  const groups = byPage(notebook.pages, highlights);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <section className="space-y-2" aria-labelledby="general-title">
        <h2 id="general-title" className="text-xl font-semibold tracking-tight">
          General notes
        </h2>
        <Card className="h-[36rem] overflow-hidden py-0">
          <GeneralNotes initial={notebook.documents} />
        </Card>
      </section>

      <section className="space-y-2" aria-labelledby="pages-title">
        <h2 id="pages-title" className="text-xl font-semibold tracking-tight">
          By page
        </h2>
        {error && <p role="alert">{error}</p>}
        {groups.length === 0 && (
          <Card className="px-4">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Highlighter className="size-4 shrink-0" aria-hidden />
              Nothing yet. On a lesson, a worked example, or the glossary, highlight text or write
              in the notebook on the right.
            </p>
          </Card>
        )}
        {groups.map((group) => (
          <Card key={group.page} className="gap-3 px-4">
            <Link
              href={group.page}
              className="flex items-center gap-1 font-medium text-primary hover:underline"
            >
              {group.title} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
            {group.note && (
              <div className="space-y-1">
                <h3 className="text-xs font-medium uppercase text-muted-foreground">Notes</h3>
                <p className="whitespace-pre-line">{notesText(group.note.html)}</p>
              </div>
            )}
            {group.items.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium uppercase text-muted-foreground">Highlights</h3>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <HighlightItem
                      key={item.id}
                      item={item}
                      onChange={(note) => changeNote(item.id, note)}
                      onRemove={() => remove(item.id)}
                    />
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </section>
    </div>
  );
}
