import { notFound } from "next/navigation";
import Workspace from "@/components/Workspace";
import { findExample, findKata } from "@/lib/library";

export default async function KataPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kata = await findKata(id);
  if (!kata) notFound();
  return <Workspace kata={kata} hasExample={(await findExample(id)) !== undefined} />;
}
