import { readFile } from "node:fs/promises";
import path from "node:path";
import { attemptDir } from "@/lib/attempts";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const png = await readFile(path.join(attemptDir(id), "diagram.png"));
    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
