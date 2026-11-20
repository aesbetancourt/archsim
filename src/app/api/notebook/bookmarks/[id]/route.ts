import { removeBookmark } from "@/lib/store/notebook";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  await removeBookmark(id);
  return Response.json({ ok: true });
}
