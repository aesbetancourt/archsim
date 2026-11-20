import { jsonFile } from "./json-file";

/**
 * The lessons that the user marked as done, with the time of the mark, by the slug of the lesson.
 * It is saved in data/progress.json.
 */
export type Progress = { done: Record<string, string> };

function normalize(value: unknown): Progress {
  const done = (value as Partial<Progress> | undefined)?.done;
  if (!done || typeof done !== "object" || Array.isArray(done)) return { done: {} };
  return {
    done: Object.fromEntries(
      Object.entries(done).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ),
  };
}

const store = jsonFile("progress.json", normalize);
/**
 * Read the lessons that the user marked as done from data/progress.json.
 * A missing or damaged file gives no lessons.
 * @example
 * const { done } = await readProgress();
 */
export const readProgress = store.read;

/**
 * Mark a lesson as done in data/progress.json, or remove the mark.
 * @param slug The slug of the lesson.
 * @param done True to mark the lesson as done. False to remove the mark.
 * @returns The progress, after the change.
 * @throws When the app cannot write data/progress.json.
 * @example
 * await setLessonDone("caching", true);
 */
export function setLessonDone(slug: string, done: boolean): Promise<Progress> {
  return store.change((progress) => {
    if (done) progress.done[slug] = new Date().toISOString();
    else delete progress.done[slug];
    return progress;
  });
}
