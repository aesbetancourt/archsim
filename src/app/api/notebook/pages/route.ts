import { readNotebook, savePageNote } from "@/lib/store/notebook";
import { pageNoteUpdate, readBody } from "@/lib/requests";

/**
 * Get the notes of one page, as HTML. A page with no notes gets an empty text.
 * @param request The request. Its `page` search parameter is the path of the page.
 * @returns The `html` of the notes.
 */
export async function GET(request: Request) {
  const page = new URL(request.url).searchParams.get("page") ?? "";
  const { pages } = await readNotebook();
  return Response.json({ html: pages.find((item) => item.page === page)?.html ?? "" });
}

/**
 * Save the notes of one page.
 * @param request The request. Its body has the page and the HTML of the notes.
 * @returns `{ ok: true }`, or 400 when the body is not valid.
 */
export async function PUT(request: Request) {
  const update = await readBody(request, pageNoteUpdate);
  if (update instanceof Response) return update;
  await savePageNote(update);
  return Response.json({ ok: true });
}
