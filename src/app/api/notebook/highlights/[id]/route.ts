import { removeHighlight, updateHighlightNote } from "@/lib/store/notebook";
import { highlightUpdate, readBody } from "@/lib/requests";
import { HTTP } from "@/lib/http-status";

type Context = { params: Promise<{ id: string }> };

/**
 * Save the note of one highlight.
 * @param request The request. Its body has the new note.
 * @returns The changed highlight. 400 when the body is not valid, 404 when the highlight is
 * not known.
 */
export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const update = await readBody(request, highlightUpdate);
  if (update instanceof Response) return update;
  const highlight = await updateHighlightNote(id, update.note);
  if (!highlight) return Response.json({ error: "Unknown highlight." }, { status: HTTP.notFound });
  return Response.json(highlight);
}

/**
 * Remove one highlight.
 * @param _request The request. The handler does not read it.
 * @returns `{ ok: true }`.
 */
export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  await removeHighlight(id);
  return Response.json({ ok: true });
}
