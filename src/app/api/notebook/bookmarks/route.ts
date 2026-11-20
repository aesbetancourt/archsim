import { addBookmark, readNotebook } from "@/lib/store/notebook";
import { bookmarkCreate, readBody } from "@/lib/requests";

/**
 * Get the bookmarks of one page.
 * @param request The request. Its `page` search parameter is the path of the page.
 * @returns The bookmarks of the page. A page with no bookmarks gets an empty list.
 */
export async function GET(request: Request) {
  const page = new URL(request.url).searchParams.get("page") ?? "";
  const { bookmarks } = await readNotebook();
  return Response.json(bookmarks.filter((item) => item.page === page));
}

/**
 * Add a bookmark to the notebook.
 * @param request The request. Its body has the page and the heading of the bookmark.
 * @returns The new bookmark, or 400 when the body is not valid.
 */
export async function POST(request: Request) {
  const input = await readBody(request, bookmarkCreate);
  if (input instanceof Response) return input;
  return Response.json(await addBookmark(input));
}
