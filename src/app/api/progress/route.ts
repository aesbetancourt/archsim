import { readProgress, setLessonDone } from "@/lib/store/progress";
import { progressUpdate, readBody } from "@/lib/requests";
import { getLesson } from "@/lib/content/lesson-reader";

export async function GET() {
  return Response.json(await readProgress());
}

// Mark one lesson as done, or not done.
export async function PUT(request: Request) {
  const update = await readBody(request, progressUpdate);
  if (update instanceof Response) return update;
  if (!getLesson(update.slug)) return Response.json({ error: "Unknown lesson." }, { status: 404 });
  return Response.json(await setLessonDone(update.slug, update.done));
}
