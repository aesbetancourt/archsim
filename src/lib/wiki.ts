import { readFile } from "node:fs/promises";
import path from "node:path";
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
