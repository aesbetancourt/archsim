import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Review } from "@/lib/ai/rubric";
import { timeId } from "@/lib/random-id";
import { SCORE_MAX, SCORE_MIN } from "@/lib/ai/score";
import { PERCENT } from "@/lib/utils";
import { mean } from "es-toolkit";

const ROOT = path.join(process.cwd(), "data", "attempts");

/**
 * One reviewed attempt at a kata: the answers of the person, the review, and the overall score.
 * It is saved in data/attempts/<id>/attempt.json.
 */
export type Attempt = {
  id: string;
  kataId: string;
  createdAt: string;
  // The core functions and the scope that the person selected. Old attempts do not have it.
  scope?: string;
  // The private notes of the person. The reviewer does not get them.
  notes?: string;
  characteristics: string;
  style: string;
  rationale: string;
  review: Review;
  overall: number;
  // The model that wrote the review.
  reviewer?: string;
};

/**
 * The directory of an attempt in data/attempts/. An attempt ID becomes a directory name.
 * Reject all other shapes.
 * @param id The ID of the attempt.
 * @returns The full path of the directory.
 * @throws When the ID has characters other than lowercase letters, digits, and hyphens.
 * @example
 * const dir = attemptDir("1763600000000-a1b2c3");
 */
export function attemptDir(id: string): string {
  if (!/^[a-z0-9-]+$/.test(id)) {
    throw new Error("Invalid attempt ID.");
  }
  return path.join(ROOT, id);
}

/**
 * Make a directory for a new attempt in data/attempts/, with a new ID.
 * The review route writes the diagram there before the review starts.
 * @returns The new ID and the full path of its directory.
 * @throws When the app cannot make the directory.
 * @example
 * const { id, dir } = await createAttemptDir();
 */
export async function createAttemptDir(): Promise<{ id: string; dir: string }> {
  const id = timeId();
  const dir = attemptDir(id);
  await mkdir(dir, { recursive: true });
  return { id, dir };
}

/**
 * Write the attempt to data/attempts/<id>/attempt.json. An attempt with this file is reviewed.
 * @param attempt The attempt to save. Its directory must exist.
 * @throws When the ID is not valid, or the app cannot write the file.
 * @example
 * await saveAttempt({ ...attempt, review, overall: overallScore(review) });
 */
export async function saveAttempt(attempt: Attempt): Promise<void> {
  await writeFile(
    path.join(attemptDir(attempt.id), "attempt.json"),
    JSON.stringify(attempt, null, 2),
  );
}

/**
 * Read one attempt from data/attempts/<id>/attempt.json.
 * @param id The ID of the attempt.
 * @returns The attempt, or undefined when the ID is not valid or the attempt has no review.
 * @example
 * const attempt = await getAttempt(id);
 */
export async function getAttempt(id: string): Promise<Attempt | undefined> {
  try {
    return JSON.parse(await readFile(path.join(attemptDir(id), "attempt.json"), "utf8"));
  } catch {
    return undefined;
  }
}

/**
 * Remove one attempt, with its diagram and its review: its directory in data/attempts/.
 * @param id The ID of the attempt.
 * @throws When the ID is not valid.
 * @example
 * await deleteAttempt(id);
 */
export async function deleteAttempt(id: string): Promise<void> {
  await rm(attemptDir(id), { recursive: true, force: true });
}

/**
 * Remove all attempts: the data/attempts/ directory. This includes attempts that have no review.
 * @example
 * await clearAttempts();
 */
export async function clearAttempts(): Promise<void> {
  await rm(ROOT, { recursive: true, force: true });
}

/**
 * Return the reviewed attempts in data/attempts/, newest first.
 * @returns The attempts. The list is empty when there are none.
 * @example
 * const attempts = await listAttempts();
 */
export async function listAttempts(): Promise<Attempt[]> {
  const ids = await readdir(ROOT).catch(() => []);
  const attempts = await Promise.all(ids.map((id) => getAttempt(id)));
  return attempts
    .filter((attempt): attempt is Attempt => attempt !== undefined)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Convert the mean dimension score (1 to 5) to a 0 to 100 scale.
 * @param review The review with a score for each dimension.
 * @returns The overall score, from 0 to 100. A review with no dimensions gets 0.
 * @example
 * overallScore(review); // 75 when the mean score is 4
 */
export function overallScore(review: Review): number {
  const scores = review.dimensions.map((dimension) => dimension.score);
  if (scores.length === 0) return 0;
  return Math.round(((mean(scores) - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * PERCENT);
}
