import { addHighlight, readNotebook } from "@/lib/store/notebook";
import { highlightCreate, readBody } from "@/lib/requests";

/**
 * Get the highlights of one page.
 * @param request The request. Its `page` search parameter is the path of the page.
 * @returns The highlights of the page. A page with no highlights gets an empty list.
 */
export async function GET(request: Request) {
  const page = new URL(request.url).searchParams.get("page") ?? "";
  const { highlights } = await readNotebook();
  return Response.json(highlights.filter((item) => item.page === page));
}

/**
 * Add a highlight to the notebook.
 * @param request The request. Its body has the page and the highlighted text.
 * @returns The new highlight, or 400 when the body is not valid.
 */
export async function POST(request: Request) {
  const input = await readBody(request, highlightCreate);
  if (input instanceof Response) return input;
  return Response.json(await addHighlight(input));
}
