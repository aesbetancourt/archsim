import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseQuestions, slugify, type Question } from "./questions";
import { getLesson } from "./lesson-reader";
import { route } from "@/lib/routes";

// The cases of the product drill: cost estimates, proof of value, business models, priorities,
// and timing. The text is in content/product-drill.md. Each section of the file is a filter.

/** The slug of the lesson that teaches each section, for the link under the reference answer. */
export const productLessons: Record<string, string> = {
  Cost: "llm-cost-latency",
  "Value and proof": "product-thinking",
  "Business model": "product-thinking",
  Prioritization: "prioritization",
  "Timing and adoption": "product-thinking",
};

let cache: Promise<Question[]> | null = null;

/**
 * Read the cases of the product drill from content/product-drill.md.
 * In production, the app reads the file one time and keeps the result.
 * @returns The cases, each with a link to the lesson that teaches its section.
 * @throws An error when the file cannot be read.
 * @example
 * const cases = await readProductCases();
 */
export function readProductCases(): Promise<Question[]> {
  // The file changes only when the app is built or the file is edited in development.
  if (process.env.NODE_ENV === "production" && cache) return cache;
  cache = load();
  return cache;
}

async function load(): Promise<Question[]> {
  const markdown = await readFile(path.join(process.cwd(), "content", "product-drill.md"), "utf8");
  const ids = new Set<string>();
  return parseQuestions(markdown, () => true).map((item) => {
    let id = `product:${slugify(item.question)}`;
    // Two cases with the same start get a number.
    for (let n = 2; ids.has(id); n++) id = `product:${slugify(item.question)}-${n}`;
    ids.add(id);
    const slug = productLessons[item.heading] ?? "product-thinking";
    return {
      id,
      slug,
      lesson: getLesson(slug)?.title ?? "Product thinking",
      section: item.heading,
      question: item.question,
      points: item.points,
      href: route(`/learn/${slug}`),
    };
  });
}
