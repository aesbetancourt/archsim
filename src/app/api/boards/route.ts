import { createBoard } from "@/lib/boards";

// Create an empty board.
export async function POST() {
  const board = await createBoard();
  return Response.json({ id: board.id });
}
