"use client";

import { Bookmark as BookmarkIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { addBookmark, listBookmarks, removeBookmark } from "@/lib/browser/api";
import { keys } from "@/lib/browser/query-keys";
import type { Bookmark } from "@/lib/store/notebook";
import { cn } from "@/lib/utils";

type Value = {
  // The bookmarks of this page: the whole page first, then in the order they were made.
  items: Bookmark[];
  find: (anchor: string) => Bookmark | undefined;
  toggle: (anchor: string, heading: string) => Promise<void>;
};

const BookmarksContext = createContext<Value | null>(null);

/**
 * The bookmarks of the learning page, for the notebook sidebar.
 * @returns The bookmarks of the page and the functions to find and toggle one, or null outside
 * a BookmarksProvider.
 */
export function usePageBookmarks(): Value | null {
  return useContext(BookmarksContext);
}

/**
 * The bookmarks of one learning page. The headings of the page add and remove them.
 * @returns The children, with the bookmarks of the page in the context.
 */
export function BookmarksProvider({
  page,
  getTitle,
  children,
}: {
  page: string;
  getTitle: () => string;
  children: React.ReactNode;
}) {
  const client = useQueryClient();
  // The list of each page has its own key, so a new page starts with its own bookmarks.
  const { data } = useQuery({
    queryKey: keys.bookmarks(page),
    queryFn: () => listBookmarks(page),
  });
  // The bookmark of the whole page is first.
  const mine = [...(data ?? [])].sort(
    (a, b) => Number(Boolean(a.anchor)) - Number(Boolean(b.anchor)),
  );
  const find = (anchor: string) => mine.find((item) => item.anchor === anchor);

  // A new bookmark shows when the server saved it.
  const add = useMutation({
    mutationFn: addBookmark,
    onSuccess: (added) => {
      client.setQueryData<Bookmark[]>(keys.bookmarks(added.page), (list = []) => [
        ...list.filter((item) => item.id !== added.id),
        added,
      ]);
    },
  });

  // A removed bookmark goes away at once. If the server did not remove it, it comes back.
  const remove = useMutation({
    mutationFn: (bookmark: Bookmark) => removeBookmark(bookmark.id),
    onMutate: async (bookmark) => {
      // An answer that is on its way must not put the bookmark back.
      await client.cancelQueries({ queryKey: keys.bookmarks(bookmark.page) });
      client.setQueryData<Bookmark[]>(keys.bookmarks(bookmark.page), (list = []) =>
        list.filter((item) => item.id !== bookmark.id),
      );
    },
    onError: (_error, bookmark) => {
      client.setQueryData<Bookmark[]>(keys.bookmarks(bookmark.page), (list = []) => [
        ...list,
        bookmark,
      ]);
    },
  });

  // Each mutation shows its own result, so a failure needs no more work here.
  async function toggle(anchor: string, heading: string) {
    const found = find(anchor);
    if (found) {
      await remove.mutateAsync(found).catch(() => undefined);
      return;
    }
    await add.mutateAsync({ page, title: getTitle(), heading, anchor }).catch(() => undefined);
  }

  return <BookmarksContext value={{ items: mine, find, toggle }}>{children}</BookmarksContext>;
}

// What the bookmark button does. An empty anchor is the whole page.
function bookmarkLabel(on: boolean, anchor: string): string {
  if (on) return "Remove the bookmark";
  if (anchor) return "Bookmark this section";
  return "Bookmark this page";
}

/**
 * The bookmark button of a heading. An empty anchor is the whole page.
 * Outside a learning page, for example in the help chat, it shows nothing.
 * @returns A button that adds or removes the bookmark.
 */
export function BookmarkButton({ anchor, heading }: { anchor: string; heading: string }) {
  const bookmarks = usePageBookmarks();
  if (!bookmarks) return null;
  const on = Boolean(bookmarks.find(anchor));
  const label = bookmarkLabel(on, anchor);

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
