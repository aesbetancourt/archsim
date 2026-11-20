import { removeBookmark } from "@/lib/store/notebook";

type Context = { params: Promise<{ id: string }> };

/**
 * Remove one bookmark.
 * @param _request The request. The handler does not read it.
 * @returns `{ ok: true }`.
 */
export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  await removeBookmark(id);
  return Response.json({ ok: true });
}
