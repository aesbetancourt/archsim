import { deleteStory, updateStory } from "@/lib/notebook";
import { readBody, storyFields } from "@/lib/requests";

type Context = { params: Promise<{ id: string }> };

// Save all parts of one story.
export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const fields = await readBody(request, storyFields);
  if (fields instanceof Response) return fields;
  const story = await updateStory(id, fields);
  if (!story) return Response.json({ error: "Unknown story." }, { status: 404 });
  return Response.json(story);
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  await deleteStory(id);
  return Response.json({ ok: true });
}
