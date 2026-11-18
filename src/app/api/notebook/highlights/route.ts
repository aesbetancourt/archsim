import { addHighlight, readNotebook } from "@/lib/notebook";
import { highlightCreate, readBody } from "@/lib/requests";

// The highlights of one page.
export async function GET(request: Request) {
  const page = new URL(request.url).searchParams.get("page") ?? "";
  const { highlights } = await readNotebook();
  return Response.json(highlights.filter((item) => item.page === page));
}

export async function POST(request: Request) {
  const input = await readBody(request, highlightCreate);
  if (input instanceof Response) return input;
  return Response.json(await addHighlight(input));
}
