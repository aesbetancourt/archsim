"use client";

import { ArrowRight, Bookmark as BookmarkIcon, ChevronRight, Highlighter, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import GeneralNotes from "@/components/GeneralNotes";
import HighlightItem from "@/components/HighlightItem";
import StoryBank from "@/components/StoryBank";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Bookmark, Highlight, Notebook, PageNote } from "@/lib/store/notebook";
import { notesText } from "@/lib/notes-html";
import { plural } from "@/lib/text";

type LessonGroup = {
  page: string;
  title: string;
  note?: PageNote;
  highlights: Highlight[];
  bookmarks: Bookmark[];
  last: string;
};

// Put the notes, highlights, and bookmarks of each lesson together.
// The most recently used lesson is first.
function byLesson(pages: PageNote[], highlights: Highlight[], bookmarks: Bookmark[]) {
  const groups = new Map<string, LessonGroup>();
  const group = (page: string, title: string, time: string) => {
    const found = groups.get(page) ?? { page, title, highlights: [], bookmarks: [], last: "" };
    if (time > found.last) found.last = time;
    groups.set(page, found);
    return found;
  };
  for (const note of pages) group(note.page, note.title, note.updatedAt).note = note;
  for (const item of highlights) group(item.page, item.title, item.createdAt).highlights.push(item);
  for (const item of bookmarks) group(item.page, item.title, item.createdAt).bookmarks.push(item);
  for (const found of groups.values()) {
    // Show the passages in reading order, and the bookmark of the whole page first.
    found.highlights.sort((a, b) => a.start - b.start);
    found.bookmarks.sort(
      (a, b) =>
        Number(Boolean(a.anchor)) - Number(Boolean(b.anchor)) ||
        a.createdAt.localeCompare(b.createdAt),
    );
  }
  return [...groups.values()].sort((a, b) => b.last.localeCompare(a.last));
}

// A short summary of a lesson, for example "2 bookmarks · 5 highlights · notes".
function summary(group: LessonGroup): string {
  const parts: string[] = [];
  if (group.bookmarks.length) parts.push(plural(group.bookmarks.length, "bookmark"));
  if (group.highlights.length) parts.push(plural(group.highlights.length, "highlight"));
  if (group.note) parts.push("notes");
  return parts.join(" · ");
}

const subheading = "text-xs font-medium uppercase text-muted-foreground";

// All of the notebook: the lessons with their bookmarks, notes, and highlights, the general notes,
// and the story bank. Each lesson is closed at first, so the page stays short.
export default function NotebookView({ notebook }: { notebook: Notebook }) {
  const [highlights, setHighlights] = useState(notebook.highlights);
  const [bookmarks, setBookmarks] = useState(notebook.bookmarks);
  const [filter, setFilter] = useState("");
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

  async function removeHighlight(id: string) {
    setError("");
    const response = await fetch(`/api/notebook/highlights/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("The highlight was not removed. Try again.");
      return;
    }
    setHighlights((items) => items.filter((item) => item.id !== id));
  }

  async function removeBookmark(id: string) {
    setError("");
    const response = await fetch(`/api/notebook/bookmarks/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("The bookmark was not removed. Try again.");
      return;
    }
    setBookmarks((items) => items.filter((item) => item.id !== id));
  }

  const all = byLesson(notebook.pages, highlights, bookmarks);
  const query = filter.trim().toLowerCase();
  const groups = query ? all.filter((group) => group.title.toLowerCase().includes(query)) : all;

  return (
    <div className="space-y-10">
      <section className="space-y-2" aria-labelledby="lessons-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="lessons-title" className="text-xl font-semibold tracking-tight">
            By lesson
          </h2>
          {all.length > 0 && (
            <Input
              type="search"
              aria-label="Filter the lessons"
              placeholder="Filter the lessons"
              className="h-9 max-w-xs"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          )}
        </div>
        {error && <p role="alert">{error}</p>}
        {all.length === 0 ? (
          <Card className="px-4">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Highlighter className="size-4 shrink-0" aria-hidden />
              Nothing yet. On a lesson, bookmark a heading, highlight text, or write in the notebook
              on the right.
            </p>
          </Card>
        ) : groups.length === 0 ? (
          <p className="text-muted-foreground">No lesson matches “{filter}”.</p>
        ) : (
          <Card className="gap-0 divide-y py-0">
            {groups.map((group) => (
              <details key={group.page} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                  <ChevronRight
                    className="size-4 shrink-0 transition-transform group-open:rotate-90"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">{group.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{summary(group)}</span>
                </summary>
                <div className="space-y-4 px-4 pt-1 pb-4 sm:pl-10">
                  <Link
                    href={group.page}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Open the lesson <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                  {group.bookmarks.length > 0 && (
                    <div className="space-y-1">
                      <h3 className={subheading}>Bookmarks</h3>
                      <ul className="space-y-0.5">
                        {group.bookmarks.map((item) => (
                          <li key={item.id} className="flex items-center gap-1">
                            <Link
                              href={item.anchor ? `${item.page}#${item.anchor}` : item.page}
                              className="flex min-w-0 flex-1 items-center gap-2 rounded-base px-1.5 py-1 hover:bg-muted"
                            >
                              <BookmarkIcon
                                className="size-3.5 shrink-0 fill-current text-primary"
                                aria-hidden
                              />
                              <span className="truncate">
                                {item.anchor ? item.heading : "The whole lesson"}
                              </span>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 opacity-50 hover:opacity-100"
                              aria-label={`Remove the bookmark ${item.heading}`}
                              title="Remove the bookmark"
                              onClick={() => removeBookmark(item.id)}
                            >
                              <X />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {group.note && (
                    <div className="space-y-1">
                      <h3 className={subheading}>Notes</h3>
                      <p className="whitespace-pre-line">{notesText(group.note.html)}</p>
                    </div>
                  )}
                  {group.highlights.length > 0 && (
                    <div className="space-y-2">
                      <h3 className={subheading}>Highlights</h3>
                      <ul className="space-y-3">
                        {group.highlights.map((item) => (
                          <HighlightItem
                            key={item.id}
                            item={item}
                            onChange={(note) => changeNote(item.id, note)}
                            onRemove={() => removeHighlight(item.id)}
                          />
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </Card>
        )}
      </section>

      <section className="space-y-2" aria-labelledby="general-title">
        <h2 id="general-title" className="text-xl font-semibold tracking-tight">
          General notes
        </h2>
        {/* A short list. A click opens the note on its own page. */}
        <Card className="max-h-96 overflow-hidden py-0">
          <GeneralNotes initial={notebook.documents} insights openAsPage />
        </Card>
      </section>

      <section className="space-y-2" aria-labelledby="stories-title">
        <h2 id="stories-title" className="text-xl font-semibold tracking-tight">
          Story bank
        </h2>
        <StoryBank initial={notebook.stories} />
      </section>
    </div>
  );
}
