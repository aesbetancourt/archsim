import { deleteStory, updateStory } from "@/lib/store/notebook";
import { readBody, storyFields } from "@/lib/requests";
import { HTTP } from "@/lib/http-status";

type Context = { params: Promise<{ id: string }> };

// Save all parts of one story.
export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const fields = await readBody(request, storyFields);
  if (fields instanceof Response) return fields;
  const story = await updateStory(id, fields);
  if (!story) return Response.json({ error: "Unknown story." }, { status: HTTP.notFound });
  return Response.json(story);
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  await deleteStory(id);
  return Response.json({ ok: true });
}
