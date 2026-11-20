import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { lessons } from "./lesson-reader";
import { headingId, lessonSections } from "./lessons";
import { route } from "@/lib/routes";

// The interview questions of the lessons, for the question drill. Each lesson has a section
// "Interview questions" (or "What interviewers probe" in a system design case). In it, a question
// is a bold line, and the points of a strong answer are the list below it.

/** One interview question of a lesson, with the points of a strong answer. */
export type Question = {
  // Stable while the text of the question does not change: the lesson slug and the question.
  id: string;
  slug: string;
  lesson: string;
  // The section of the Learn area, for the filter of the drill.
  section: string;
  question: string;
  // The points of a strong answer, as Markdown list items without the "- ".
  points: string[];
  // The link to the question section of the lesson.
  href: string;
};

const SECTIONS = ["Interview questions", "What interviewers probe"];
// "**Question?**" or "1. **"Question?"**", alone on its line.
const QUESTION = /^(?:\d+\.\s+)?\*\*(.+?)\*\*\s*$/;
const POINT = /^\s*[-*]\s+(.+)$/;

// The longest ID of a question, in characters.
const MAX_SLUG_LENGTH = 80;
// The start of a Markdown line with a section heading.
const H2 = "## ";

/**
 * Make the ID part of a question from its text.
 * @param text The text of the question.
 * @returns Lowercase letters and digits, with a hyphen in place of each other run. The maximum
 * length is 80 characters.
 * @example
 * slugify("What is a cache?"); // "what-is-a-cache"
 */
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_SLUG_LENGTH);

/**
 * Find the questions in the Markdown of one lesson. Only the sections that `accept` selects
 * count. The product drill accepts each section, because its sections are its filters.
 * @param markdown The Markdown text of the lesson.
 * @param accept Selects a section by its heading. Without it, only the interview sections count.
 * @returns The questions that have points, each with its section heading.
 * @example
 * parseQuestions(markdown); // the questions of "Interview questions"
 * parseQuestions(markdown, () => true); // the questions of all sections
 */
export function parseQuestions(
  markdown: string,
  accept: (heading: string) => boolean = (heading) => SECTIONS.includes(heading),
): { heading: string; question: string; points: string[] }[] {
  const found: { heading: string; question: string; points: string[] }[] = [];
  let heading = "";
  let current: { heading: string; question: string; points: string[] } | null = null;
  for (const line of markdown.split("\n")) {
    if (line.startsWith(H2)) {
      const title = line.slice(H2.length).trim();
      heading = accept(title) ? title : "";
      current = null;
      continue;
    }
    if (!heading) continue;
    const question = line.match(QUESTION);
    if (question) {
      // Remove the quotation marks around the question, if it has them.
      const text = question[1].trim().replace(/^"(.*)"$/, "$1");
      current = { heading, question: text, points: [] };
      found.push(current);
      continue;
    }
    const point = line.match(POINT);
    if (point && current) current.points.push(point[1].trim());
  }
  // A bold line with no list is not a question with an answer.
  return found.filter((item) => item.points.length > 0);
}

const sectionOf = new Map(
  lessonSections.flatMap((section) =>
    section.pages.map((page) => [page.slug, section.title] as const),
  ),
);

let cache: Promise<Question[]> | null = null;

/**
 * Read the questions of all lessons, in the reading order of the Learn area.
 * In production, the app reads the lessons one time and keeps the result.
 * @returns The questions, each with a link to its section of the lesson.
 * @throws An error when the folder content/learn or a lesson file cannot be read.
 * @example
 * const questions = await readQuestions();
 */
export function readQuestions(): Promise<Question[]> {
  // The lessons change only when the app is built or a file is edited in development.
  if (process.env.NODE_ENV === "production" && cache) return cache;
  cache = load();
  return cache;
}

async function load(): Promise<Question[]> {
  const folder = path.join(process.cwd(), "content", "learn");
  const files = new Set(await readdir(folder));
  const questions: Question[] = [];
  for (const page of lessons) {
    if (!files.has(`${page.slug}.md`)) continue;
    const markdown = await readFile(path.join(folder, `${page.slug}.md`), "utf8");
    const ids = new Set<string>();
    for (const item of parseQuestions(markdown)) {
      let id = `${page.slug}:${slugify(item.question)}`;
      // Two questions with the same start get a number.
      for (let n = 2; ids.has(id); n++) id = `${page.slug}:${slugify(item.question)}-${n}`;
      ids.add(id);
      questions.push({
        id,
        slug: page.slug,
        lesson: page.title,
        section: sectionOf.get(page.slug) ?? "",
        question: item.question,
        points: item.points,
        href: route(`/learn/${page.slug}#${headingId(item.heading)}`),
      });
    }
  }
  return questions;
}
