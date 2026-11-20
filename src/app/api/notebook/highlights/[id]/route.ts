import { removeHighlight, updateHighlightNote } from "@/lib/store/notebook";
import { highlightUpdate, readBody } from "@/lib/requests";

type Context = { params: Promise<{ id: string }> };

// Save the note of one highlight.
export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const update = await readBody(request, highlightUpdate);
  if (update instanceof Response) return update;
  const highlight = await updateHighlightNote(id, update.note);
  if (!highlight) return Response.json({ error: "Unknown highlight." }, { status: 404 });
  return Response.json(highlight);
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  await removeHighlight(id);
  return Response.json({ ok: true });
}
