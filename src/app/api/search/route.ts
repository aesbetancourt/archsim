import { buildSearchIndex } from "@/lib/content/search-index";

/**
 * Get the search index of the lessons, katas, terms, cheatsheets, and questions.
 * @returns The search index.
 */
export async function GET() {
  return Response.json(await buildSearchIndex());
}
