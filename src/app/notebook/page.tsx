import { NotebookPen } from "lucide-react";
import NotebookView from "@/components/NotebookView";
import { readNotebook } from "@/lib/notebook";

// Read the notebook on each request.
export const dynamic = "force-dynamic";

export default async function NotebookPage() {
  const notebook = await readNotebook();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-3">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <NotebookPen className="size-7 shrink-0 text-primary" aria-hidden />
          Notebook
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          The place to keep your study in order. General notes are for a topic. The notes and
          highlights of a page are in the sidebar of that page, and here they are together. The
          notebook is saved in data/notebook.json on this computer.
        </p>
      </header>
      <NotebookView notebook={notebook} />
    </main>
  );
}
