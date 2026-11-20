import { deleteAttempt } from "@/lib/store/attempts";
import { HTTP } from "@/lib/http-status";

/**
 * Remove one attempt, with its diagram and its review.
 * @param _request The request. The handler does not read it.
 * @returns `{ ok: true }`, or 400 with an error when the ID is not valid.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteAttempt(id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: HTTP.badRequest });
  }
}
