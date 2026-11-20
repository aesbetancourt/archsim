import { clearAttempts } from "@/lib/store/attempts";

/**
 * Remove the full attempt history.
 * @returns `{ ok: true }`.
 */
export async function DELETE() {
  await clearAttempts();
  return Response.json({ ok: true });
}
