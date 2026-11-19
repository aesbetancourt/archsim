"use client";

import { FileText, NotebookPen, PanelRightClose, PanelRightOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import AutosaveNotes, { putJson } from "@/components/AutosaveNotes";
import GeneralNotes from "@/components/GeneralNotes";
import HighlightItem from "@/components/HighlightItem";
import LinkButton from "@/components/LinkButton";
import { Button } from "@/components/ui/button";
import type { Highlight } from "@/lib/notebook";
import { cn } from "@/lib/utils";

// Whether the sidebar is open. This is a preference of this browser only.
const OPEN_KEY = "charrette:notebook-open";
const listeners = new Set<() => void>();
// The value when the browser storage is not available.
let openInMemory = true;

function isOpen(): boolean {
  try {
    const saved = localStorage.getItem(OPEN_KEY);
    return saved === null ? openInMemory : saved === "open";
  } catch {
    return openInMemory;
  }
}

function setOpen(open: boolean) {
  openInMemory = open;
  try {
    localStorage.setItem(OPEN_KEY, open ? "open" : "closed");
  } catch {
    // Storage is not available. The value lasts for this page only.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// The notes of one page. The parent gives a new key for each page, so each page loads its own.
function PageNotes({ page, getTitle }: { page: string; getTitle: () => string }) {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    fetch(`/api/notebook/pages?page=${encodeURIComponent(page)}`)
      .then((response) => (response.ok ? response.json() : { html: "" }))
      .then((body: { html: string }) => current && setHtml(body.html))
      .catch(() => current && setHtml(""));
    return () => {
      current = false;
    };
  }, [page]);

  if (html === null) return <p className="p-4 text-muted-foreground">Loading the notes.</p>;
  return (
    <AutosaveNotes
      compact
      label="Notes on this page"
      placeholder="Notes on this page: what it says in your own words, and what is not clear yet."
      initialHtml={html}
      save={(next) => putJson("/api/notebook/pages", { page, title: getTitle(), html: next })}
    />
  );
}

type Props = {
  page: string;
  // The title of the page, read from the page when the notes are saved.
  getTitle: () => string;
  // The highlights of this page, in reading order.
  highlights: Highlight[];
  onShow: (id: string) => void;
  onNote: (id: string, note: string) => void;
  onRemove: (id: string) => void;
};

// The notebook next to a learning page. It has two parts: this page, and the general notes.
// It stays in the page when it is closed, so no editor loses its text.
export default function NotebookSidebar({
  page,
  getTitle,
  highlights,
  onShow,
  onNote,
  onRemove,
}: Props) {
  const open = useSyncExternalStore(subscribe, isOpen, () => true);
  const [tab, setTab] = useState<"page" | "general">("page");

  return (
    <>
      {!open && (
        <Button
          variant="neutral"
          size="sm"
          className="fixed right-4 bottom-4 z-40 hidden lg:inline-flex"
          onClick={() => setOpen(true)}
        >
          <PanelRightOpen /> Notebook
        </Button>
      )}
      {/* A narrow screen has no space for the sidebar. It links to the notebook page. */}
      <LinkButton
        variant="neutral"
        size="sm"
        href="/notebook"
        className="fixed right-4 bottom-4 z-40 lg:hidden"
      >
        <NotebookPen /> Notebook
      </LinkButton>

      <aside
        aria-label="Notebook"
        className={cn("hidden w-80 shrink-0 border-l-2 bg-card xl:w-96", open && "lg:block")}
      >
        {/* The height leaves space for the site header, so the bottom is visible before a scroll. */}
        <div className="sticky top-0 flex h-[calc(100dvh-3.5rem)] flex-col text-sm">
          <div className="flex items-center gap-1 border-b-2 px-3 py-2">
            <div role="tablist" aria-label="Notebook" className="flex items-center gap-1">
              <Button
                role="tab"
                aria-selected={tab === "page"}
                variant={tab === "page" ? "noShadow" : "ghost"}
                size="sm"
                onClick={() => setTab("page")}
              >
                <NotebookPen /> This page
              </Button>
              <Button
                role="tab"
                aria-selected={tab === "general"}
                variant={tab === "general" ? "noShadow" : "ghost"}
                size="sm"
                onClick={() => setTab("general")}
              >
                <FileText /> General
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto size-8"
              aria-label="Close the notebook"
              title="Close the notebook"
              onClick={() => setOpen(false)}
            >
              <PanelRightClose />
            </Button>
          </div>

          {/* Both parts stay loaded. Only the selected one shows. */}
          <div className={cn("min-h-0 flex-1 flex-col", tab === "page" ? "flex" : "hidden")}>
            <div className="min-h-48 flex-1">
              <PageNotes key={page} page={page} getTitle={getTitle} />
            </div>
            <section
              aria-labelledby="page-highlights"
              className="max-h-[45%] shrink-0 overflow-y-auto border-t-2 p-3"
            >
              <h2 id="page-highlights" className="mb-2 font-medium">
                Highlights{highlights.length > 0 && ` (${highlights.length})`}
              </h2>
              {highlights.length === 0 ? (
                <p className="text-muted-foreground">
                  None yet. Select text on the page, then click Highlight.
                </p>
              ) : (
                <ul className="space-y-3">
                  {highlights.map((item) => (
                    <HighlightItem
                      // A note changed on the page replaces the text in the box.
                      key={`${item.id}:${item.note}`}
                      item={item}
                      onShow={() => onShow(item.id)}
                      onChange={(note) => onNote(item.id, note)}
                      onRemove={() => onRemove(item.id)}
                    />
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className={cn("min-h-0 flex-1", tab === "general" ? "block" : "hidden")}>
            <GeneralNotes compact />
          </div>

          <Link href="/notebook" className="border-t-2 px-3 py-2 text-primary hover:underline">
            Open the whole notebook
          </Link>
        </div>
      </aside>
    </>
  );
}
