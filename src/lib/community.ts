import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Kata } from "./katas";

// The Architectural Katas collection of Ted Neward.
// The app reads the katas from the public repository and keeps a local copy.
// The kata texts are not part of this project.
export const COMMUNITY_SOURCE = {
  name: "Architectural Katas",
  owner: "Ted Neward",
  url: "https://github.com/tedneward/ArchKatas",
  site: "http://www.architecturalkatas.com",
};

const LIST_URL = "https://api.github.com/repos/tedneward/ArchKatas/contents/";
const CACHE = path.join(process.cwd(), "data", "community.json");

type RawKata = { title: string; description: string[]; credit?: string };
type RepoFile = { name: string; download_url: string };

const split = (text: string) =>
  text
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1));

// Convert one kata file to the kata shape of this app.
function toKata(fileName: string, raw: RawKata): Kata {
  // Some katas start with a note in brackets. Use the next paragraph as the context.
  const paragraphs = [...raw.description];
  if (paragraphs.length > 1 && paragraphs[0].startsWith("(")) paragraphs.push(paragraphs.shift()!);
  const [context = "", ...rest] = paragraphs;
  const kata: Kata = {
    id: `ak-${fileName.replace(/\.json$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: raw.title,
    difficulty: "medium",
    context,
    requirements: [],
    constraints: [],
    details: [],
    source: { name: COMMUNITY_SOURCE.name, url: COMMUNITY_SOURCE.url, credit: raw.credit },
  };
  for (const paragraph of rest) {
    const match = paragraph.match(/^([A-Z][A-Za-z ]{2,25}):\s*([\s\S]*)$/);
    const label = match?.[1].trim().toLowerCase();
    if (label === "requirements") kata.requirements.push(...split(match![2]));
    else if (label === "users" || label === "projected users") kata.users = match![2];
    else if (label === "additional context" || label === "restriction" || label === "other details")
      kata.constraints.push(...split(match![2]));
    else kata.details!.push(paragraph);
  }
  return kata;
}

async function download(): Promise<Kata[]> {
  const list = await fetch(LIST_URL, { headers: { Accept: "application/vnd.github+json" } });
  if (!list.ok) throw new Error(`GitHub answered ${list.status} for the kata list.`);
  const files = ((await list.json()) as RepoFile[]).filter((file) => file.name.endsWith(".json"));
  const katas = await Promise.all(
    files.map(async (file) => {
      const response = await fetch(file.download_url);
      if (!response.ok) throw new Error(`GitHub answered ${response.status} for ${file.name}.`);
      return toKata(file.name, (await response.json()) as RawKata);
    }),
  );
  return katas.sort((a, b) => a.title.localeCompare(b.title));
}

// Return the local copy. Return an empty list if there is none.
export async function cachedCommunity(): Promise<Kata[]> {
  try {
    return JSON.parse(await readFile(CACHE, "utf8")).katas;
  } catch {
    return [];
  }
}

// Return the katas. Download them if there is no local copy, or if refresh is set.
export async function loadCommunity(refresh = false): Promise<Kata[]> {
  if (!refresh) {
    const cached = await cachedCommunity();
    if (cached.length > 0) return cached;
  }
  const katas = await download();
  await mkdir(path.dirname(CACHE), { recursive: true });
  await writeFile(CACHE, JSON.stringify({ fetchedAt: new Date().toISOString(), katas }, null, 2));
  return katas;
}
