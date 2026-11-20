import { deleteDocument, updateDocument } from "@/lib/store/notebook";
import { documentUpdate, readBody } from "@/lib/requests";
import { HTTP } from "@/lib/http-status";

type Context = { params: Promise<{ id: string }> };

// Save the title and the text of a general note.
export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const update = await readBody(request, documentUpdate);
  if (update instanceof Response) return update;
  const document = await updateDocument(id, update);
  if (!document) return Response.json({ error: "Unknown note." }, { status: HTTP.notFound });
  return Response.json(document);
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  await deleteDocument(id);
  return Response.json({ ok: true });
}
