"use client";

import { usePathname } from "next/navigation";
import { BookmarksProvider } from "@/components/Bookmarks";
import NotebookSidebar from "@/components/NotebookSidebar";
import ReadAloud from "@/components/ReadAloud";
import { useHighlighter } from "@/components/useHighlighter";

/**
 * A learning page with the notebook in a sidebar on the right.
 * The user can select text to highlight it and add a note.
 * The highlights are saved in the notebook on the server, for each page.
 * The read-aloud player reads the page text and highlights the current sentence.
 * @returns The page with the notebook sidebar and the read-aloud player.
 */
export default function StudyLayout({ children }: { children: React.ReactNode }) {
  const page = usePathname();
  const { root, handlers, highlights, show, changeNote, remove, pageTitle, overlay } =
    useHighlighter({ page });

  return (
    <BookmarksProvider page={page} getTitle={pageTitle}>
      <div className="flex min-w-0 flex-1">
        {/* These handlers only read the text selection. The sidebar has all the actions. */}
        {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div ref={root} className="min-w-0 flex-1" {...handlers}>
          {children}
        </div>
        <NotebookSidebar
          page={page}
          getTitle={pageTitle}
          highlights={highlights}
          onShow={show}
          onNote={changeNote}
          onRemove={remove}
        />
      </div>
      {overlay}
      <ReadAloud root={root} page={page} />
    </BookmarksProvider>
  );
}
