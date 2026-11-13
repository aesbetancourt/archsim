import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getWorkedExample, workedExamples, type WorkedExample } from "./examples";
import { getKata, katas, type Kata } from "./katas";

// A problem that the user added, with the answer that Claude wrote for it.
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

export async function saveCustom(entry: CustomEntry): Promise<void> {
  await mkdir(ROOT, { recursive: true });
  await writeFile(path.join(ROOT, `${entry.kata.id}.json`), JSON.stringify(entry, null, 2));
}

export async function findKata(id: string): Promise<Kata | undefined> {
  return getKata(id) ?? (await readCustom(id))?.kata;
}

export async function findExample(id: string): Promise<WorkedExample | undefined> {
  return getWorkedExample(id) ?? (await readCustom(id))?.example;
}

// Return the user's problems first, then the built-in katas.
export async function allKatas(): Promise<Kata[]> {
  return [...(await listCustom()).map((entry) => entry.kata), ...katas];
}

export async function allExamples(): Promise<{ kata: Kata; example: WorkedExample }[]> {
  const builtIn = workedExamples.flatMap((example) => {
    const kata = getKata(example.kataId);
    return kata ? [{ kata, example }] : [];
  });
  return [...(await listCustom()), ...builtIn];
}
