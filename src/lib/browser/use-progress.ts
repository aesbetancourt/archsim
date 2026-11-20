"use client";

import { useEffect, useSyncExternalStore } from "react";

// The lessons marked as done, shared by all components on the page: the sidebar, the lesson
// header, and the button at the end of a lesson. The server keeps the marks in data/progress.json.
type Done = Record<string, string>;

const EMPTY: Done = {};
let done: Done = EMPTY;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: Done) {
  done = next;
  for (const listener of listeners) listener();
}

function load() {
  loading ??= fetch("/api/progress")
    .then((response) => (response.ok ? response.json() : { done: {} }))
    .then((body: { done: Done }) => publish(body.done))
    .catch(() => {
      // The marks are not available now. Try again on the next page.
      loading = null;
    });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Mark a lesson as done or not done. The page changes at once. If the save fails, it changes back.
export async function setDone(slug: string, value: boolean): Promise<void> {
  const before = done;
  const next = { ...done };
  if (value) next[slug] = new Date().toISOString();
  else delete next[slug];
  publish(next);
  try {
    const response = await fetch("/api/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, done: value }),
    });
    if (!response.ok) throw new Error();
  } catch {
    publish(before);
    throw new Error("The mark was not saved. Try again.");
  }
}

export function useProgress(): Done {
  useEffect(load, []);
  return useSyncExternalStore(
    subscribe,
    () => done,
    () => EMPTY,
  );
}
