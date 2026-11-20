import { readFile } from "node:fs/promises";
import path from "node:path";
import { blockGroups, blocks } from "./blocks";
import { characteristics, kataSteps, styleLessons } from "./kata-method";
import { lessonSections, type Lesson } from "./lessons";
import { sumBy } from "es-toolkit";

// Find a lesson, and read its text. This file reads the Markdown files of content/learn, so it is
// for the server. The list of the lessons is in lessons.ts.

export { headingId } from "./lessons";

/** All the lessons of the Learn area, in reading order. */
export const lessons: Lesson[] = lessonSections.flatMap((section) => section.pages);

/**
 * Find a lesson by its slug.
 * @param slug The slug of the lesson.
 * @returns The lesson, or undefined when no lesson has the slug.
 * @example
 * getLesson("architect-role")?.title;
 */
export function getLesson(slug: string): Lesson | undefined {
  return lessons.find((page) => page.slug === slug);
}

/**
 * Find the lessons before and after a lesson, in reading order.
 * @param slug The slug of the lesson.
 * @returns The previous and the next lesson. The first lesson has no previous lesson, and the last
 * lesson has no next lesson.
 * @example
 * const { previous, next } = neighbors("architect-role");
 */
export function neighbors(slug: string): { previous?: Lesson; next?: Lesson } {
  const index = lessons.findIndex((page) => page.slug === slug);
  return { previous: lessons[index - 1], next: lessons[index + 1] };
}

/**
 * Read the Markdown text of an article from content/learn.
 * @param slug The slug of the article.
 * @returns The Markdown text, or undefined when the slug is not valid or the file does not exist.
 * @example
 * const markdown = await readArticle("architect-role");
 */
export async function readArticle(slug: string): Promise<string | undefined> {
  if (!/^[a-z0-9-]+$/.test(slug)) return undefined;
  try {
    return await readFile(path.join(process.cwd(), "content", "learn", `${slug}.md`), "utf8");
  } catch {
    return undefined;
  }
}

/**
 * Find the second-level headings of an article, for the contents list.
 * @param markdown The Markdown text of the article.
 * @returns The text of each "## " heading, in order.
 * @example
 * headings("# Title\n## First\n## Second"); // ["First", "Second"]
 */
export function headings(markdown: string): string[] {
  return [...markdown.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim());
}

const WORDS_PER_MINUTE = 200;

// Count the words in all text values of a value. A diagram description adds its labels, which
// is close to the time a reader spends on the diagram.
function wordsIn(value: unknown): number {
  if (typeof value === "string") return value.split(/\s+/).filter(Boolean).length;
  if (Array.isArray(value)) return sumBy(value, (item) => wordsIn(item));
  if (value && typeof value === "object") return wordsIn(Object.values(value));
  return 0;
}

// The text of a custom page, from the data that the page shows.
function customText(page: Lesson): unknown {
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

/**
 * Find the time to read a page, in whole minutes. Each page takes at least one minute.
 * @param page The lesson.
 * @param markdown The Markdown text of the lesson, if it has a Markdown file.
 * @returns The reading time in minutes.
 * @example
 * readingMinutes(page, await readArticle(page.slug)); // 7
 */
export function readingMinutes(page: Lesson, markdown?: string): number {
  // A custom page counts the text of its component and of its Markdown file, if it has one.
  const words = wordsIn(customText(page)) + wordsIn(markdown ? readableMarkdown(markdown) : "");
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
