import { readFile } from "node:fs/promises";
import path from "node:path";
import { blockGroups, blocks } from "./blocks";
import { characteristics, kataSteps, styleLessons } from "./learn";
import { wikiSections, type WikiPage } from "./wiki-pages";

export { headingId } from "./wiki-pages";

export const wikiPages: WikiPage[] = wikiSections.flatMap((section) => section.pages);

export function getWikiPage(slug: string): WikiPage | undefined {
  return wikiPages.find((page) => page.slug === slug);
}

// Return the pages before and after a page, in reading order.
export function neighbors(slug: string): { previous?: WikiPage; next?: WikiPage } {
  const index = wikiPages.findIndex((page) => page.slug === slug);
  return { previous: wikiPages[index - 1], next: wikiPages[index + 1] };
}

// Read the Markdown text of an article.
export async function readArticle(slug: string): Promise<string | undefined> {
  if (!/^[a-z0-9-]+$/.test(slug)) return undefined;
  try {
    return await readFile(path.join(process.cwd(), "content", "learn", `${slug}.md`), "utf8");
  } catch {
    return undefined;
  }
}

// Return the second-level headings of an article, for the contents list.
export function headings(markdown: string): string[] {
  return [...markdown.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim());
}

const WORDS_PER_MINUTE = 200;

// Count the words in all text values of a value. A diagram description adds its labels, which
// is close to the time a reader spends on the diagram.
function wordsIn(value: unknown): number {
  if (typeof value === "string") return value.split(/\s+/).filter(Boolean).length;
  if (Array.isArray(value)) return value.reduce((sum: number, item) => sum + wordsIn(item), 0);
  if (value && typeof value === "object") return wordsIn(Object.values(value));
  return 0;
}

// The text of a custom page, from the data that the page shows.
function customText(page: WikiPage): unknown {
  if (page.kind === "method") return kataSteps;
  if (page.kind === "characteristics") return characteristics;
  if (page.kind === "styles") return styleLessons.map((lesson) => [lesson.name, lesson.idea]);
  if (page.kind === "style") return styleLessons.find((lesson) => lesson.id === page.slug);
  if (page.kind === "blocks") return [blockGroups, blocks];
  return "";
}

// A walkthrough block is JSON. Count only the text that a reader reads in it: the titles, the
// paragraphs, and the key ideas. The IDs and positions are not text.
function readableMarkdown(markdown: string): string {
  return markdown.replace(/^```walkthrough\n([\s\S]*?)^```$/gm, (_block, json: string) => {
    try {
      const { steps = [] } = JSON.parse(json) as {
        steps?: { title?: string; text?: string; key?: string }[];
      };
      return steps.map((step) => [step.title, step.text, step.key].join(" ")).join(" ");
    } catch {
      return "";
    }
  });
}

// The time to read a page, in whole minutes. Each page takes at least one minute.
export function readingMinutes(page: WikiPage, markdown?: string): number {
  // A custom page counts the text of its component and of its Markdown file, if it has one.
  const words = wordsIn(customText(page)) + wordsIn(markdown ? readableMarkdown(markdown) : "");
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
