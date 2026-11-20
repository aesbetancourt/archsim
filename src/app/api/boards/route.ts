import { createBoard } from "@/lib/store/boards";

/**
 * Create an empty board.
 * @returns The `id` of the new board.
 */
export async function POST() {
  const board = await createBoard();
  return Response.json({ id: board.id });
}
