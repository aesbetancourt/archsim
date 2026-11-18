import { createDocument, readNotebook } from "@/lib/notebook";
import { documentCreate, readBody } from "@/lib/requests";

// All general notes, with their text.
export async function GET() {
  const { documents } = await readNotebook();
  return Response.json(documents);
}

export async function POST(request: Request) {
  const input = await readBody(request, documentCreate);
  if (input instanceof Response) return input;
  return Response.json(await createDocument(input.title));
}
