import { deleteCustom } from "@/lib/store/library";
import { HTTP } from "@/lib/http-status";

type Context = { params: Promise<{ id: string }> };

// Delete a problem that the user added with "Solve a problem". Built-in katas cannot be deleted.
export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!(await deleteCustom(id))) {
    return Response.json({ error: "Unknown problem." }, { status: HTTP.notFound });
  }
  return Response.json({ ok: true });
}
