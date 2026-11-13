import { notFound } from "next/navigation";
import BoardEditor from "@/components/BoardEditor";
import { getBoard } from "@/lib/boards";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await getBoard(id);
  if (!board) notFound();
  return <BoardEditor board={board} />;
}
