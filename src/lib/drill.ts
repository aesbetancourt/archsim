// A vocabulary drill with the Leitner system: each term moves through five boxes.
// A known term moves to the next box and comes back later. A missed term goes back to box 1.
// The progress is saved in the browser, like the kata drafts.

export type CardState = {
  // 1 to 5. A higher box means the term is known better.
  box: number;
  // When the term comes back, as an ISO date.
  due: string;
};

// The state of each term, by glossary ID.
export type DrillProgress = Record<string, CardState>;

const LAST_BOX = 5;
// Days to wait before a term in each box comes back. Box 1 comes back in the same session.
const WAIT_DAYS = [0, 1, 3, 7, 14];
const DAY_MS = 24 * 60 * 60 * 1000;
// The progress of the vocabulary drill. Other drills pass their own key.
const STORAGE_KEY = "charrette:drill";

// The new state of a term after the user says whether they knew it.
export function review(state: CardState | undefined, knew: boolean, now: Date): CardState {
  let box = 1;
  if (knew) {
    box = Math.min((state?.box ?? 1) + 1, LAST_BOX);
  }
  const due = new Date(now.getTime() + WAIT_DAYS[box - 1] * DAY_MS);
  return { box, due: due.toISOString() };
}

// The terms to practice now: due reviews first, the oldest first, then up to `newLimit` new terms.
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

// Count the terms in each box, for the progress summary.
export function boxCounts(progress: DrillProgress): number[] {
  const counts = Array.from({ length: LAST_BOX }, () => 0);
  for (const state of Object.values(progress)) {
    counts[state.box - 1] += 1;
  }
  return counts;
}

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

// Save the progress. Return false if the browser refuses.
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
