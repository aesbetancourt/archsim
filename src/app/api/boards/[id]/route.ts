import { deleteBoard, updateBoard } from "@/lib/store/boards";
import { boardUpdate, readBody } from "@/lib/requests";

type Context = { params: Promise<{ id: string }> };

// Save the title, the notes, and the drawing of a board.
export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const change = await readBody(request, boardUpdate);
  if (change instanceof Response) return change;
  try {
    const board = await updateBoard(id, change);
    if (!board) return Response.json({ error: "Unknown board." }, { status: 404 });
    return Response.json({ updatedAt: board.updatedAt });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  try {
    await deleteBoard(id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
