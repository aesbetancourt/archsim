import { notFound } from "next/navigation";
import BoardEditor from "@/components/BoardEditor";
import { getBoard } from "@/lib/store/boards";

/**
 * One board of the scratchpad, to draw and write notes.
 * @returns The board editor, or the not-found page when the board does not exist.
 */
export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await getBoard(id);
  if (!board) notFound();
  return <BoardEditor board={board} />;
}
