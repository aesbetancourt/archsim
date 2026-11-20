import { createStory, readNotebook } from "@/lib/store/notebook";
import { readBody, storyFields } from "@/lib/requests";

/**
 * Get the stories of the story bank.
 * @returns The stories.
 */
export async function GET() {
  const { stories } = await readNotebook();
  return Response.json(stories);
}

/**
 * Add a story to the story bank.
 * @param request The request. Its body has all fields of the story.
 * @returns The new story, or 400 when the body is not valid.
 */
export async function POST(request: Request) {
  const fields = await readBody(request, storyFields);
  if (fields instanceof Response) return fields;
  return Response.json(await createStory(fields));
}
