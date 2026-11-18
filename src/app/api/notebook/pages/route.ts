import { readNotebook, savePageNote } from "@/lib/notebook";
import { pageNoteUpdate, readBody } from "@/lib/requests";

// The notes of one page, as HTML. A page with no notes gets an empty text.
export async function GET(request: Request) {
  const page = new URL(request.url).searchParams.get("page") ?? "";
  const { pages } = await readNotebook();
  return Response.json({ html: pages.find((item) => item.page === page)?.html ?? "" });
}

export async function PUT(request: Request) {
  const update = await readBody(request, pageNoteUpdate);
  if (update instanceof Response) return update;
  await savePageNote(update);
  return Response.json({ ok: true });
}
