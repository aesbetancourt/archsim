import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Review } from "./rubric";

const ROOT = path.join(process.cwd(), "data", "attempts");

export type Attempt = {
  id: string;
  kataId: string;
  createdAt: string;
  characteristics: string;
  style: string;
  rationale: string;
  review: Review;
  overall: number;
  // The model that wrote the review.
  reviewer?: string;
};

// An attempt ID becomes a directory name. Reject all other shapes.
export function attemptDir(id: string): string {
  if (!/^[a-z0-9-]+$/.test(id)) {
    throw new Error("Invalid attempt ID.");
  }
  return path.join(ROOT, id);
}

export async function createAttemptDir(): Promise<{ id: string; dir: string }> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const dir = attemptDir(id);
  await mkdir(dir, { recursive: true });
  return { id, dir };
}

export async function saveAttempt(attempt: Attempt): Promise<void> {
  await writeFile(path.join(attemptDir(attempt.id), "attempt.json"), JSON.stringify(attempt, null, 2));
}

export async function getAttempt(id: string): Promise<Attempt | undefined> {
  try {
    return JSON.parse(await readFile(path.join(attemptDir(id), "attempt.json"), "utf8"));
  } catch {
    return undefined;
  }
}

// Remove one attempt, with its diagram and its review.
export async function deleteAttempt(id: string): Promise<void> {
  await rm(attemptDir(id), { recursive: true, force: true });
}

// Remove all attempts. This includes attempts that have no review.
export async function clearAttempts(): Promise<void> {
  await rm(ROOT, { recursive: true, force: true });
}

// Return the reviewed attempts, newest first.
export async function listAttempts(): Promise<Attempt[]> {
  const ids = await readdir(ROOT).catch(() => []);
  const attempts = await Promise.all(ids.map((id) => getAttempt(id)));
  return attempts
    .filter((attempt): attempt is Attempt => attempt !== undefined)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Convert the mean dimension score (1 to 5) to a 0 to 100 scale.
export function overallScore(review: Review): number {
  const scores = review.dimensions.map((dimension) => dimension.score);
  if (scores.length === 0) return 0;
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(((mean - 1) / 4) * 100);
}
