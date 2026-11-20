import { notFound } from "next/navigation";
import NotePage from "@/components/NotePage";
import { readNotebook } from "@/lib/store/notebook";

// Read the note on each request, so the page shows the saved text.
export const dynamic = "force-dynamic";

/**
 * One general note of the notebook, to read and edit.
 * @returns The note editor, or the not-found page when the note does not exist.
 */
export default async function GeneralNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { documents } = await readNotebook();
  const document = documents.find((item) => item.id === id);
  if (!document) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-6 text-sm leading-relaxed">
      <NotePage document={document} />
    </main>
  );
}
