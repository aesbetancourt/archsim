import { buildSearchIndex } from "@/lib/content/search-index";

// The search index of the lessons, katas, terms, cheatsheets, and questions.
export async function GET() {
  return Response.json(await buildSearchIndex());
}
