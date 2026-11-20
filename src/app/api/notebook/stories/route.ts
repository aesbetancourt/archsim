import { createStory, readNotebook } from "@/lib/store/notebook";
import { readBody, storyFields } from "@/lib/requests";

// The stories of the story bank.
export async function GET() {
  const { stories } = await readNotebook();
  return Response.json(stories);
}

export async function POST(request: Request) {
  const fields = await readBody(request, storyFields);
  if (fields instanceof Response) return fields;
  return Response.json(await createStory(fields));
}
