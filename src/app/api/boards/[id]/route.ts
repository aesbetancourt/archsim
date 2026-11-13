import { deleteBoard, updateBoard, type Board } from "@/lib/boards";

type Context = { params: Promise<{ id: string }> };

// Save the title, the notes, and the drawing of a board.
export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const change = (await request.json()) as Pick<Board, "title" | "notes" | "scene">;
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
