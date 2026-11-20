import { jsonFile } from "./json-file";

// The lessons that the user marked as done, with the time of the mark.
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
export const readProgress = store.read;

export function setLessonDone(slug: string, done: boolean): Promise<Progress> {
  return store.change((progress) => {
    if (done) progress.done[slug] = new Date().toISOString();
    else delete progress.done[slug];
    return progress;
  });
}
