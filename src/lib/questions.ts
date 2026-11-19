import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { wikiPages } from "./wiki";
import { headingId, wikiSections } from "./wiki-pages";

// The interview questions of the lessons, for the question drill. Each lesson has a section
// "Interview questions" (or "What interviewers probe" in a system design case). In it, a question
// is a bold line, and the points of a strong answer are the list below it.

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

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

// Find the questions in the Markdown of one lesson. Only the sections that `accept` selects
// count. The product drill accepts each section, because its sections are its filters.
export function parseQuestions(
  markdown: string,
  accept: (heading: string) => boolean = (heading) => SECTIONS.includes(heading),
): { heading: string; question: string; points: string[] }[] {
  const found: { heading: string; question: string; points: string[] }[] = [];
  let heading = "";
  let current: { heading: string; question: string; points: string[] } | null = null;
  for (const line of markdown.split("\n")) {
    if (line.startsWith("## ")) {
      heading = accept(line.slice(3).trim()) ? line.slice(3).trim() : "";
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
  wikiSections.flatMap((section) =>
    section.pages.map((page) => [page.slug, section.title] as const),
  ),
);

let cache: Promise<Question[]> | null = null;

// Read the questions of all lessons, in the reading order of the Learn area.
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
  for (const page of wikiPages) {
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
        href: `/learn/${page.slug}#${headingId(item.heading)}`,
      });
    }
  }
  return questions;
}
