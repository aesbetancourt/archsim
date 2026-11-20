"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readProgress, setLessonDone } from "./api";
import { keys } from "./query-keys";

// The lessons marked as done, shared by all components on the page: the sidebar, the lesson
// header, and the button at the end of a lesson. The server keeps the marks in data/progress.json.
type Done = Record<string, string>;

const EMPTY: Done = {};

// The marks load one time for each visit to the app. A change here is the only thing that
// changes them, so they do not load again.
export function useProgress(): Done {
  const { data } = useQuery({
    queryKey: keys.progress,
    queryFn: async () => (await readProgress()).done,
    staleTime: Infinity,
  });
  return data ?? EMPTY;
}

// Get the function that marks a lesson as done or not done. The page changes at once. If the
// save fails, the page changes back and the function throws.
export function useSetDone(): (slug: string, value: boolean) => Promise<void> {
  const client = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: ({ slug, value }: { slug: string; value: boolean }) => setLessonDone(slug, value),
    onMutate: async ({ slug, value }) => {
      // An answer that is on its way must not replace the new mark.
      await client.cancelQueries({ queryKey: keys.progress });
      const before = client.getQueryData<Done>(keys.progress) ?? EMPTY;
      const next = { ...before };
      if (value) next[slug] = new Date().toISOString();
      else delete next[slug];
      client.setQueryData(keys.progress, next);
      return { before };
    },
    onError: (_error, _mark, context) => {
      client.setQueryData(keys.progress, context?.before ?? EMPTY);
    },
  });

  return async (slug, value) => {
    try {
      await mutateAsync({ slug, value });
    } catch {
      throw new Error("The mark was not saved. Try again.");
    }
  };
}
