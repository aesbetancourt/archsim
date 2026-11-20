import { deleteStory, updateStory } from "@/lib/store/notebook";
import { readBody, storyFields } from "@/lib/requests";
import { HTTP } from "@/lib/http-status";

type Context = { params: Promise<{ id: string }> };

/**
 * Save all parts of one story.
 * @param request The request. Its body has all fields of the story.
 * @returns The changed story. 400 when the body is not valid, 404 when the story is not known.
 */
export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const fields = await readBody(request, storyFields);
  if (fields instanceof Response) return fields;
  const story = await updateStory(id, fields);
  if (!story) return Response.json({ error: "Unknown story." }, { status: HTTP.notFound });
  return Response.json(story);
}

/**
 * Remove one story.
 * @param _request The request. The handler does not read it.
 * @returns `{ ok: true }`.
 */
export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  await deleteStory(id);
  return Response.json({ ok: true });
}
