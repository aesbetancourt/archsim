import { readProgress, setLessonDone } from "@/lib/store/progress";
import { progressUpdate, readBody } from "@/lib/requests";
import { getLesson } from "@/lib/content/lesson-reader";
import { HTTP } from "@/lib/http-status";

/**
 * Get the lessons that the user has marked as done.
 * @returns The progress, with the time each lesson was marked done.
 */
export async function GET() {
  return Response.json(await readProgress());
}

/**
 * Mark one lesson as done, or not done.
 * @param request The request. Its body has the lesson slug and the done flag.
 * @returns The new progress. 400 when the body is not valid, 404 when the lesson is not known.
 */
export async function PUT(request: Request) {
  const update = await readBody(request, progressUpdate);
  if (update instanceof Response) return update;
  if (!getLesson(update.slug))
    return Response.json({ error: "Unknown lesson." }, { status: HTTP.notFound });
  return Response.json(await setLessonDone(update.slug, update.done));
}
