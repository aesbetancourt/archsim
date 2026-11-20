import { deleteDocument, updateDocument } from "@/lib/store/notebook";
import { documentUpdate, readBody } from "@/lib/requests";
import { HTTP } from "@/lib/http-status";

type Context = { params: Promise<{ id: string }> };

/**
 * Save the title and the text of a general note.
 * @param request The request. Its body has the title and the text.
 * @returns The changed note. 400 when the body is not valid, 404 when the note is not known.
 */
export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const update = await readBody(request, documentUpdate);
  if (update instanceof Response) return update;
  const document = await updateDocument(id, update);
  if (!document) return Response.json({ error: "Unknown note." }, { status: HTTP.notFound });
  return Response.json(document);
}

/**
 * Remove one general note.
 * @param _request The request. The handler does not read it.
 * @returns `{ ok: true }`.
 */
export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  await deleteDocument(id);
  return Response.json({ ok: true });
}
