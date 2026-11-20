"use client";

import { CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { notesText } from "@/lib/notes-html";
import { search, type SearchItem } from "@/lib/content/search";
import { cn } from "@/lib/utils";
import { listNotes, searchIndex } from "@/lib/browser/api";
import { keys } from "@/lib/browser/query-keys";
import type { NoteDoc } from "@/lib/store/notebook";

// A general note as an item of the search.
function noteItem(note: NoteDoc): SearchItem {
  const text = notesText(note.html);
  return {
    kind: "Note",
    title: note.title,
    subtitle: text.split("\n")[0],
    href: "/notebook",
    keywords: text,
  };
}

const suggestions: SearchItem[] = [
  { kind: "Page", title: "All lessons", href: "/learn" },
  { kind: "Page", title: "Cheatsheets", href: "/learn/cheatsheets" },
  { kind: "Page", title: "Question drill", href: "/drill/questions" },
  { kind: "Page", title: "Notebook", href: "/notebook" },
  { kind: "Page", title: "Katas", href: "/" },
  { kind: "Page", title: "Guide", href: "/guide" },
];

// The search of the app. ⌘K or Ctrl+K opens it from any page.
export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The content of the app does not change, so its index loads one time, when the search opens
  // for the first time. After a failure, it loads again at the next open.
  const content = useQuery({
    queryKey: keys.searchIndex,
    queryFn: searchIndex,
    enabled: open,
    staleTime: Infinity,
  });
  // The general notes change, so they load each time the search opens.
  const notes = useQuery({ queryKey: keys.searchNotes, queryFn: listNotes, enabled: open });
  const items = useMemo(
    () => [...(content.data ?? []), ...(notes.data ?? []).map(noteItem)],
    [content.data, notes.data],
  );

  const results = query.trim() ? search(items, query) : suggestions;
  const selected = Math.min(active, Math.max(results.length - 1, 0));

  // Keep the selected result in view when the arrow keys move it.
  useEffect(() => {
    list.current?.querySelector(`[data-index="${selected}"]`)?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  function go(item: SearchItem | undefined) {
    if (!item) return;
    setOpen(false);
    setQuery("");
    router.push(item.href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") setActive(Math.min(selected + 1, results.length - 1));
    else if (event.key === "ArrowUp") setActive(Math.max(selected - 1, 0));
    else if (event.key === "Enter") go(results[selected]);
    else return;
    event.preventDefault();
  }

  return (
    <>
      <Button
        variant="neutral"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden w-48 justify-start text-muted-foreground lg:inline-flex xl:w-56"
        aria-label="Search (⌘K)"
      >
        <Search /> Search
        <kbd className="ml-auto rounded border border-border px-1.5 font-mono text-[0.7rem]">
          ⌘K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="lg:hidden"
        aria-label="Search (⌘K)"
      >
        <Search />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setQuery("");
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="top-[15%] translate-y-0 gap-0 p-0 sm:max-w-2xl"
        >
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              // oxlint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search lessons, cases, terms, questions, katas, and notes"
              aria-label="Search"
              aria-controls="search-results"
              aria-activedescendant={results.length ? `search-result-${selected}` : undefined}
              role="combobox"
              aria-expanded
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded border border-border px-1.5 font-mono text-[0.7rem] text-muted-foreground">
              esc
            </kbd>
          </div>
          {/* A native select cannot show a result in two lines, so the list uses the ARIA
              combobox pattern on div elements. The input keeps the focus. */}
          <div
            ref={list}
            id="search-results"
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="listbox"
            aria-label="Results"
            className="max-h-[60vh] overflow-y-auto p-2"
          >
            {!query.trim() && <p className="px-2 pt-1 pb-2 text-xs text-muted-foreground">Go to</p>}
            {query.trim() && results.length === 0 && (
              <p className="px-2 py-6 text-center text-muted-foreground">
                {items.length === 0 ? "Loading the index." : "No result. Try a shorter word."}
              </p>
            )}
            {results.map((item, position) => (
              <div
                key={`${item.kind}:${item.href}:${item.title}`}
                id={`search-result-${position}`}
                data-index={position}
                // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
                role="option"
                // The input keeps the focus. A click can still focus the option.
                tabIndex={-1}
                aria-selected={position === selected}
                onMouseMove={() => setActive(position)}
                onClick={() => go(item)}
                onKeyDown={() => undefined}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-base px-2 py-2",
                  position === selected && "bg-main text-main-foreground",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 w-16 shrink-0 rounded border px-1 text-center text-[0.65rem] font-semibold uppercase",
                    position === selected
                      ? "border-main-foreground/40"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {item.kind}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.title}</span>
                  {item.subtitle && (
                    <span
                      className={cn(
                        "block truncate text-xs",
                        position === selected ? "opacity-80" : "text-muted-foreground",
                      )}
                    >
                      {item.subtitle}
                    </span>
                  )}
                </span>
                {position === selected && (
                  <CornerDownLeft className="mt-1 size-3.5 shrink-0" aria-hidden />
                )}
              </div>
            ))}
          </div>
          <p className="border-t px-4 py-2 text-xs text-muted-foreground">
            ↑ ↓ to move · Enter to open · Esc to close
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
