import { notFound } from "next/navigation";
import Workspace from "@/components/Workspace";
import { findExample, findKata } from "@/lib/store/library";

/**
 * The workspace of one kata, where the user draws and explains a design.
 * @returns The workspace, or the not-found page when the kata does not exist.
 */
export default async function KataPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kata = await findKata(id);
  if (!kata) notFound();
  return <Workspace kata={kata} hasExample={(await findExample(id)) !== undefined} />;
}
