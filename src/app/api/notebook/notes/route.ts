import { createDocument, readNotebook } from "@/lib/store/notebook";
import { documentCreate, readBody } from "@/lib/requests";

/**
 * Get all general notes, with their text.
 * @returns The general notes.
 */
export async function GET() {
  const { documents } = await readNotebook();
  return Response.json(documents);
}

/**
 * Create an empty general note.
 * @param request The request. Its body has the title of the note.
 * @returns The new note, or 400 when the body is not valid.
 */
export async function POST(request: Request) {
  const input = await readBody(request, documentCreate);
  if (input instanceof Response) return input;
  return Response.json(await createDocument(input.title));
}
