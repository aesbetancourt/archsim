import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { cachedCommunity, loadCommunity } from "@/lib/content/community";
import { getWorkedExample, workedExamples, type WorkedExample } from "@/lib/content/examples";
import { getKata, katas, type Kata } from "@/lib/content/katas";

/**
 * A problem that the user added, with the answer that Claude wrote for it.
 * It is saved in data/custom/<kata id>.json.
 */
export type CustomEntry = {
  kata: Kata;
  example: WorkedExample;
  source: string;
  createdAt: string;
};

const ROOT = path.join(process.cwd(), "data", "custom");

async function readCustom(id: string): Promise<CustomEntry | undefined> {
  // An ID becomes a file name. Reject all other shapes.
  if (!/^[a-z0-9-]+$/.test(id)) return undefined;
  try {
    return JSON.parse(await readFile(path.join(ROOT, `${id}.json`), "utf8"));
  } catch {
    return undefined;
  }
}

async function listCustom(): Promise<CustomEntry[]> {
  const files = await readdir(ROOT).catch(() => []);
  const entries = await Promise.all(files.map((file) => readCustom(file.replace(/\.json$/, ""))));
  return entries
    .filter((entry): entry is CustomEntry => entry !== undefined)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Write a problem that the user added to data/custom/<kata id>.json.
 * A problem with the same ID is replaced.
 * @param entry The problem, its answer, and the source text.
 * @throws When the app cannot write the file.
 * @example
 * await saveCustom({ kata, example, source, createdAt: new Date().toISOString() });
 */
export async function saveCustom(entry: CustomEntry): Promise<void> {
  await mkdir(ROOT, { recursive: true });
  await writeFile(path.join(ROOT, `${entry.kata.id}.json`), JSON.stringify(entry, null, 2));
}

/**
 * Delete a problem that the user added, with its answer: its file in data/custom/.
 * The reviewed attempts of the problem stay in the history.
 * @param id The ID of the problem.
 * @returns True when the problem is deleted. False when it does not exist.
 * @throws When the app cannot delete the file.
 * @example
 * const deleted = await deleteCustom(id);
 */
export async function deleteCustom(id: string): Promise<boolean> {
  if (!(await readCustom(id))) return false;
  await rm(path.join(ROOT, `${id}.json`));
  return true;
}

/**
 * Find a kata by its ID: a built-in kata, a problem that the user added, or a community kata.
 * A community kata has an ID that starts with "ak-". With no local copy, it downloads them.
 * @param id The ID of the kata.
 * @returns The kata, or undefined when no kata has this ID.
 * @example
 * const kata = await findKata(submission.kataId);
 */
export async function findKata(id: string): Promise<Kata | undefined> {
  if (id.startsWith("ak-")) {
    const community = await loadCommunity().catch(() => []);
    return community.find((kata) => kata.id === id);
  }
  return getKata(id) ?? (await readCustom(id))?.kata;
}

/**
 * Return the title of each kata that the app knows, by ID.
 * The community katas come from the local copy only. This function does not download them.
 * @returns The titles, by kata ID.
 * @example
 * const title = (await kataTitles()).get(attempt.kataId);
 */
export async function kataTitles(): Promise<Map<string, string>> {
  const katas = [...(await allKatas()), ...(await cachedCommunity())];
  return new Map(katas.map((kata) => [kata.id, kata.title]));
}

/**
 * Find the worked example of a kata: a built-in example, or the answer to a problem that the user added.
 * @param id The ID of the kata.
 * @returns The worked example, or undefined when the kata has none.
 * @example
 * const example = await findExample(kata.id);
 */
export async function findExample(id: string): Promise<WorkedExample | undefined> {
  return getWorkedExample(id) ?? (await readCustom(id))?.example;
}

/**
 * Return the user's problems first, then the built-in katas. The community katas are not in the list.
 * @returns The katas.
 * @example
 * const katas = await allKatas();
 */
export async function allKatas(): Promise<Kata[]> {
  return [...(await listCustom()).map((entry) => entry.kata), ...katas];
}

/**
 * Return each kata that has a worked example, with the example.
 * The user's problems come first, then the built-in examples.
 * @returns The pairs of a kata and its example.
 * @example
 * const examples = await allExamples();
 */
export async function allExamples(): Promise<{ kata: Kata; example: WorkedExample }[]> {
  const builtIn = workedExamples.flatMap((example) => {
    const kata = getKata(example.kataId);
    return kata ? [{ kata, example }] : [];
  });
  return [...(await listCustom()), ...builtIn];
}
