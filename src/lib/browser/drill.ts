import { DAY_MS } from "@/lib/time";
// A vocabulary drill with the Leitner system: each term moves through five boxes.
// A known term moves to the next box and comes back later. A missed term goes back to box 1.
// The progress is saved in the browser, like the kata drafts.

/** The place of one term in the drill. */
export type CardState = {
  // 1 to 5. A higher box means the term is known better.
  box: number;
  // When the term comes back, as an ISO date.
  due: string;
};

/** The state of each term, by glossary ID. */
export type DrillProgress = Record<string, CardState>;

const LAST_BOX = 5;
// Days to wait before a term in each box comes back. Box 1 comes back in the same session.
// oxlint-disable-next-line no-magic-numbers -- A named list: the days to wait in each box.
const WAIT_DAYS = [0, 1, 3, 7, 14];
// The progress of the vocabulary drill. Other drills pass their own key.
const STORAGE_KEY = "charrette:drill";

/**
 * Get the new state of a term after the user says whether they knew it.
 * @param state The state before the review. Undefined for a new term.
 * @param knew True when the user knew the term.
 * @param now The time of the review.
 * @returns The new box of the term, and when the term comes back.
 * @example
 * const next = { ...progress, [item.id]: review(progress[item.id], knew, new Date()) };
 */
export function review(state: CardState | undefined, knew: boolean, now: Date): CardState {
  let box = 1;
  if (knew) {
    box = Math.min((state?.box ?? 1) + 1, LAST_BOX);
  }
  const due = new Date(now.getTime() + WAIT_DAYS[box - 1] * DAY_MS);
  return { box, due: due.toISOString() };
}

/**
 * Get the terms to practice now: due reviews first, the oldest first, then up to `newLimit`
 * new terms.
 * @param terms All the terms of the drill.
 * @param progress The state of each term.
 * @param now The time now.
 * @param newLimit The maximum number of new terms.
 * @returns The terms to practice, in order.
 * @example
 * const queue = dueTerms(items, loadProgress(storageKey), new Date(), newPerSession);
 */
export function dueTerms<T extends { id: string }>(
  terms: T[],
  progress: DrillProgress,
  now: Date,
  newLimit: number,
): T[] {
  const reviews = terms
    .filter((term) => progress[term.id] && new Date(progress[term.id].due) <= now)
    .sort((a, b) => progress[a.id].due.localeCompare(progress[b.id].due));
  const fresh = terms.filter((term) => !progress[term.id]).slice(0, newLimit);
  return [...reviews, ...fresh];
}

/**
 * Count the terms in each box, for the progress summary.
 * @param progress The state of each term.
 * @returns The number of terms in each box, from box 1 to box 5.
 * @example
 * boxCounts(progress); // [3, 0, 2, 0, 1]
 */
export function boxCounts(progress: DrillProgress): number[] {
  const counts = Array.from({ length: LAST_BOX }, () => 0);
  for (const state of Object.values(progress)) {
    counts[state.box - 1] += 1;
  }
  return counts;
}

/**
 * Read the saved progress of a drill. A saved term with a damaged state is left out.
 * @param key The storage key of the drill. The vocabulary drill uses the default key.
 * @returns The state of each term. Empty when the storage is not available or the saved text is
 * damaged.
 * @example
 * const saved = loadProgress(storageKey);
 */
export function loadProgress(key = STORAGE_KEY): DrillProgress {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "{}");
    if (!saved || typeof saved !== "object") return {};
    const progress: DrillProgress = {};
    for (const [id, state] of Object.entries(saved)) {
      if (isCardState(state)) progress[id] = state;
    }
    return progress;
  } catch {
    // Storage is not available, or the saved text is damaged. Start again.
    return {};
  }
}

/**
 * Save the progress of a drill.
 * @param progress The state of each term.
 * @param key The storage key of the drill. The vocabulary drill uses the default key.
 * @returns True when the progress is saved. False when the browser refuses.
 * @example
 * saveProgress(next, storageKey);
 */
export function saveProgress(progress: DrillProgress, key = STORAGE_KEY): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

function isCardState(value: unknown): value is CardState {
  if (!value || typeof value !== "object") return false;
  const { box, due } = value as Record<string, unknown>;
  return (
    typeof box === "number" &&
    box >= 1 &&
    box <= LAST_BOX &&
    typeof due === "string" &&
    !Number.isNaN(Date.parse(due))
  );
}
