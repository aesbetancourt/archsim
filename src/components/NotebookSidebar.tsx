"use client";

import {
  Bookmark as BookmarkIcon,
  FileText,
  Highlighter,
  Maximize2,
  Minimize2,
  NotebookPen,
  PanelRightClose,
  PanelRightOpen,
  X,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useEffect, useState, useSyncExternalStore } from "react";
import AutosaveNotes from "@/components/AutosaveNotes";
import { usePageBookmarks } from "@/components/Bookmarks";
import GeneralNotes from "@/components/GeneralNotes";
import HighlightItem from "@/components/HighlightItem";
import LinkButton from "@/components/LinkButton";
import { Button } from "@/components/ui/button";
import { Tip } from "@/components/ui/tooltip";
import type { Highlight } from "@/lib/store/notebook";
import { cn } from "@/lib/utils";
import { readPageNote, savePageNote } from "@/lib/browser/api";
import { keys } from "@/lib/browser/query-keys";

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
function PageNotes({
  page,
  getTitle,
  compact,
}: {
  page: string;
  getTitle: () => string;
  compact: boolean;
}) {
  // The notes load again at each visit to a page, and no copy stays for a later visit.
  // The editor must not start with old notes, because its first save would replace newer notes.
  const note = useQuery({
    queryKey: keys.pageNote(page),
    queryFn: () => readPageNote(page),
    gcTime: 0,
  });

  if (note.isPending) return <p className="p-4 text-muted-foreground">Loading the notes.</p>;
  // Without the saved notes, there is no editor. The first save of an empty editor would replace
  // the saved notes.
  if (note.isError) {
    return (
      <div className="space-y-2 p-4">
        <p role="alert">The notes of this page did not load.</p>
        <Button
          size="sm"
          variant="neutral"
          disabled={note.isFetching}
          onClick={() => void note.refetch()}
        >
          Try again
        </Button>
      </div>
    );
  }
  return (
    <AutosaveNotes
      compact={compact}
      label="Notes on this page"
      placeholder="Notes on this page: what it says in your own words, and what is not clear yet."
      initialHtml={note.data.html}
      save={(next) => savePageNote({ page, title: getTitle(), html: next })}
    />
  );
}

// The bookmarks of this page, one line each. A click goes to the place on the page.
function BookmarkList({ onGo }: { onGo: (anchor: string) => void }) {
  const bookmarks = usePageBookmarks();
  if (!bookmarks || bookmarks.items.length === 0) {
    return (
      <p className="text-muted-foreground">
        None yet. Click the bookmark next to the title or a section heading.
      </p>
    );
  }
  return (
    <ul className="space-y-0.5">
      {bookmarks.items.map((item) => (
        <li key={item.id} className="flex items-center gap-1">
          <button
            type="button"
            title="Go to this place"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-base px-1.5 py-1 text-left hover:bg-muted"
            onClick={() => onGo(item.anchor)}
          >
            <BookmarkIcon className="size-3.5 shrink-0 fill-current text-primary" aria-hidden />
            <span className="truncate">{item.anchor ? item.heading : "The whole page"}</span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 opacity-50 hover:opacity-100"
            aria-label={`Remove the bookmark ${item.heading}`}
            title="Remove the bookmark"
            onClick={() => void bookmarks.toggle(item.anchor, item.heading)}
          >
            <X />
          </Button>
        </li>
      ))}
    </ul>
  );
}

type Tab = "notes" | "highlights" | "bookmarks" | "general";

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

// The notebook next to a learning page: the notes, highlights, and bookmarks of the page, and the
// general notes. Expand shows the same panel large, over the lesson. The panel is not loaded again,
// so no editor loses its text. It also stays in the page when it is closed.
export default function NotebookSidebar({
  page,
  getTitle,
  highlights,
  onShow,
  onNote,
  onRemove,
}: Props) {
  const open = useSyncExternalStore(subscribe, isOpen, () => true);
  const [tab, setTab] = useState<Tab>("notes");
  const [expanded, setExpanded] = useState(false);
  const bookmarkCount = usePageBookmarks()?.items.length ?? 0;

  // Escape makes the large panel small again.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  // The large panel shows all the parts of this page together.
  const shows = (panel: Tab) =>
    expanded ? (panel === "general") === (tab === "general") : tab === panel;

  function go(anchor: string) {
    setExpanded(false);
    const target = anchor ? document.getElementById(anchor) : document.querySelector("main h1");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (anchor) history.replaceState(null, "", `#${anchor}`);
  }

  function showHighlight(id: string) {
    setExpanded(false);
    onShow(id);
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "notes", label: "Notes on this page", icon: <NotebookPen /> },
    { id: "highlights", label: "Highlights", icon: <Highlighter />, count: highlights.length },
    { id: "bookmarks", label: "Bookmarks", icon: <BookmarkIcon />, count: bookmarkCount },
    { id: "general", label: "General notes", icon: <FileText /> },
  ];

  return (
    <>
      {!open && (
        <Button
          variant="neutral"
          size="sm"
          className="fixed right-4 bottom-4 z-40 hidden lg:inline-flex shadow-float"
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
        className="fixed right-4 bottom-4 z-40 lg:hidden shadow-float"
      >
        <NotebookPen /> Notebook
      </LinkButton>

      {expanded && (
        <button
          type="button"
          aria-label="Make the notebook small"
          className="fixed inset-0 z-40 cursor-default bg-black/40"
          onClick={() => setExpanded(false)}
        />
      )}

      <aside
        aria-label="Notebook"
        className={cn("hidden w-80 shrink-0 border-l bg-card xl:w-96", open && "lg:block")}
      >
        {/* The height leaves space for the site header, so the bottom is visible before a scroll. */}
        <div
          role={expanded ? "dialog" : undefined}
          aria-modal={expanded || undefined}
          aria-label={expanded ? "Notebook" : undefined}
          className={cn(
            "flex flex-col bg-card text-sm",
            expanded
              ? "fixed inset-x-6 top-16 bottom-6 z-50 mx-auto max-w-6xl rounded-base border-2 shadow-float"
              : "sticky top-0 h-[calc(100dvh-3.5rem)]",
          )}
        >
          <div className="flex items-center gap-1 border-b px-3 py-2">
            <div role="tablist" aria-label="Notebook" className="flex items-center gap-2">
              {tabs
                // The large panel has one tab for this page and one for the general notes.
                .filter((item) => !expanded || item.id === "notes" || item.id === "general")
                .map((item) => {
                  const selected = expanded
                    ? (item.id === "general") === (tab === "general")
                    : tab === item.id;
                  const button = (
                    <Button
                      role="tab"
                      aria-selected={selected}
                      aria-label={expanded ? undefined : item.label}
                      variant="tab"
                      size="sm"
                      onClick={() => setTab(item.id)}
                    >
                      {item.icon}
                      {expanded && (item.id === "general" ? "General notes" : "This page")}
                      {!expanded && Boolean(item.count) && (
                        <span className="text-xs tabular-nums">{item.count}</span>
                      )}
                    </Button>
                  );
                  // A small tab shows only its icon, so a tooltip gives its name.
                  return expanded ? (
                    <Fragment key={item.id}>{button}</Fragment>
                  ) : (
                    <Tip key={item.id} label={item.label}>
                      {button}
                    </Tip>
                  );
                })}
            </div>
            {expanded && <span className="ml-3 truncate font-medium">{getTitle()}</span>}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto size-8"
              aria-label={expanded ? "Make the notebook small" : "Make the notebook large"}
              title={expanded ? "Make small (Esc)" : "Make large"}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? <Minimize2 /> : <Maximize2 />}
            </Button>
            {!expanded && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Close the notebook"
                title="Close the notebook"
                onClick={() => setOpen(false)}
              >
                <PanelRightClose />
              </Button>
            )}
          </div>

          {/* All the parts stay loaded. Only the selected ones show. */}
          <div
            className={cn(
              "min-h-0 flex-1",
              expanded && tab !== "general"
                ? "grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] grid-rows-[auto_minmax(0,1fr)]"
                : "flex flex-col",
            )}
          >
            <div
              className={cn(
                "min-h-0 flex-1",
                expanded && "row-span-2 border-r",
                shows("notes") ? "block" : "hidden",
              )}
            >
              <PageNotes key={page} page={page} getTitle={getTitle} compact={!expanded} />
            </div>
            <section
              aria-label="Bookmarks"
              className={cn(
                "min-h-0 overflow-y-auto p-3",
                expanded ? "max-h-64 border-b" : "flex-1",
                shows("bookmarks") ? "block" : "hidden",
              )}
            >
              {expanded && <h2 className="mb-2 font-medium">Bookmarks</h2>}
              <BookmarkList onGo={go} />
            </section>
            <section
              aria-label="Highlights"
              className={cn(
                "min-h-0 flex-1 overflow-y-auto p-3",
                shows("highlights") ? "block" : "hidden",
              )}
            >
              {expanded && <h2 className="mb-2 font-medium">Highlights</h2>}
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
                      onShow={() => showHighlight(item.id)}
                      onChange={(note) => onNote(item.id, note)}
                      onRemove={() => onRemove(item.id)}
                    />
                  ))}
                </ul>
              )}
            </section>
            <div className={cn("min-h-0 flex-1", shows("general") ? "block" : "hidden")}>
              <GeneralNotes compact={!expanded} />
            </div>
          </div>

          <Link href="/notebook" className="border-t px-3 py-2 text-primary hover:underline">
            Open the whole notebook
          </Link>
        </div>
      </aside>
    </>
  );
}
