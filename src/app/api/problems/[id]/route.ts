import { deleteCustom } from "@/lib/store/library";
import { HTTP } from "@/lib/http-status";

type Context = { params: Promise<{ id: string }> };

/**
 * Delete a problem that the user added with "Solve a problem". Built-in katas cannot be deleted.
 * @param _request The request. The handler does not read it.
 * @returns `{ ok: true }`, or 404 when the ID is not a problem of the user.
 */
export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!(await deleteCustom(id))) {
    return Response.json({ error: "Unknown problem." }, { status: HTTP.notFound });
  }
  return Response.json({ ok: true });
}
