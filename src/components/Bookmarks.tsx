"use client";

import { Bookmark as BookmarkIcon } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Bookmark } from "@/lib/notebook";
import { cn } from "@/lib/utils";

type Value = {
  // The bookmarks of this page: the whole page first, then in the order they were made.
  items: Bookmark[];
  find: (anchor: string) => Bookmark | undefined;
  toggle: (anchor: string, heading: string) => Promise<void>;
};

const BookmarksContext = createContext<Value | null>(null);

// The bookmarks of the learning page, for the notebook sidebar.
export function usePageBookmarks(): Value | null {
  return useContext(BookmarksContext);
}

// The bookmarks of one learning page. The headings of the page add and remove them.
export function BookmarksProvider({
  page,
  getTitle,
  children,
}: {
  page: string;
  getTitle: () => string;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<Bookmark[]>([]);

  useEffect(() => {
    let current = true;
    fetch(`/api/notebook/bookmarks?page=${encodeURIComponent(page)}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((list: Bookmark[]) => current && setItems(list))
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [page]);

  // Only the bookmarks of this page count, also while the list of a new page loads.
  const mine = items
    .filter((item) => item.page === page)
    .sort((a, b) => Number(Boolean(a.anchor)) - Number(Boolean(b.anchor)));
  const find = (anchor: string) => mine.find((item) => item.anchor === anchor);

  async function toggle(anchor: string, heading: string) {
    const found = find(anchor);
    if (found) {
      setItems((list) => list.filter((item) => item.id !== found.id));
      const response = await fetch(`/api/notebook/bookmarks/${found.id}`, { method: "DELETE" });
      // The bookmark was not removed. Show it again.
      if (!response.ok) setItems((list) => [...list, found]);
      return;
    }
    const response = await fetch("/api/notebook/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, title: getTitle(), heading, anchor }),
    });
    if (!response.ok) return;
    const added = (await response.json()) as Bookmark;
    setItems((list) => [...list.filter((item) => item.id !== added.id), added]);
  }

  return <BookmarksContext value={{ items: mine, find, toggle }}>{children}</BookmarksContext>;
}

// The bookmark button of a heading. An empty anchor is the whole page.
// Outside a learning page, for example in the help chat, it shows nothing.
export function BookmarkButton({ anchor, heading }: { anchor: string; heading: string }) {
  const bookmarks = usePageBookmarks();
  if (!bookmarks) return null;
  const on = Boolean(bookmarks.find(anchor));
  const label = on
    ? "Remove the bookmark"
    : anchor
      ? "Bookmark this section"
      : "Bookmark this page";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={() => void bookmarks.toggle(anchor, heading)}
      className={cn(
        "ml-1.5 size-8 align-middle text-muted-foreground hover:text-primary",
        on ? "text-primary" : "opacity-40 hover:opacity-100 focus-visible:opacity-100",
      )}
    >
      <BookmarkIcon className={cn(on && "fill-current")} aria-hidden />
    </Button>
  );
}
