import { readFile } from "node:fs/promises";
import path from "node:path";
import { attemptDir } from "@/lib/store/attempts";
import { HTTP } from "@/lib/http-status";

/**
 * Send the diagram image of one attempt.
 * @param _request The request. The handler does not read it.
 * @returns The diagram as PNG, or 404 when the attempt or its diagram does not exist.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const png = await readFile(path.join(attemptDir(id), "diagram.png"));
    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
  } catch {
    return new Response("Not found", { status: HTTP.notFound });
  }
}
