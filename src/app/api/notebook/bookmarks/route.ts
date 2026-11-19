import { addBookmark, readNotebook } from "@/lib/notebook";
import { bookmarkCreate, readBody } from "@/lib/requests";

// The bookmarks of one page.
export async function GET(request: Request) {
  const page = new URL(request.url).searchParams.get("page") ?? "";
  const { bookmarks } = await readNotebook();
  return Response.json(bookmarks.filter((item) => item.page === page));
}

export async function POST(request: Request) {
  const input = await readBody(request, bookmarkCreate);
  if (input instanceof Response) return input;
  return Response.json(await addBookmark(input));
}
