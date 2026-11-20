import { clearAttempts } from "@/lib/store/attempts";

// Remove the full attempt history.
export async function DELETE() {
  await clearAttempts();
  return Response.json({ ok: true });
}
