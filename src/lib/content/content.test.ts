import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getKata } from "./katas";
import { diagramSchema } from "./walkthrough";
import { headings, lessons } from "./lesson-reader";
import { headingId } from "./lessons";

// Checks for the lesson files in content/learn. Each failure names the file, so an author can
// find the problems in the files that they changed.

const folder = path.join(process.cwd(), "content", "learn");
// Pages under /learn that are not lessons.
const otherPages = new Set(["examples", "cheatsheets"]);

async function lessonFiles(): Promise<{ slug: string; markdown: string }[]> {
  const files = (await readdir(folder)).filter((file) => file.endsWith(".md"));
  return Promise.all(
    files.map(async (file) => ({
      slug: file.replace(/\.md$/, ""),
      markdown: await readFile(path.join(folder, file), "utf8"),
    })),
  );
}

describe("lesson content", () => {
  it("has a file for each article page, and a page for each file", async () => {
    const files = new Set((await lessonFiles()).map((file) => file.slug));
    const articles = lessons.filter((page) => page.kind === "article").map((page) => page.slug);
    expect(
      articles.filter((slug) => !files.has(slug)).map((slug) => `missing: ${slug}.md`),
    ).toEqual([]);
    const known = new Set(lessons.map((page) => page.slug));
    expect(
      [...files].filter((slug) => !known.has(slug)).map((slug) => `no page: ${slug}.md`),
    ).toEqual([]);
  });

  it("links only to lessons, headings, and katas that exist", async () => {
    const files = await lessonFiles();
    const headingsOf = new Map(
      files.map((file) => [file.slug, new Set(headings(file.markdown).map(headingId))]),
    );
    const known = new Set(lessons.map((page) => page.slug));
    const problems: string[] = [];
    for (const { slug, markdown } of files) {
      for (const [, target] of markdown.matchAll(/\]\((\/[^)\s]*)\)/g)) {
        const [route, hash] = target.split("#");
        const learn = route.match(/^\/learn\/([a-z0-9-]+)$/);
        const kata = route.match(/^\/kata\/([a-z0-9-]+)$/);
        if (learn) {
          const page = learn[1];
          if (!known.has(page) && !otherPages.has(page))
            problems.push(`${slug}.md: no lesson ${target}`);
          else if (hash && headingsOf.has(page) && !headingsOf.get(page)!.has(hash))
            problems.push(`${slug}.md: no heading ${target}`);
        } else if (kata) {
          if (!getKata(kata[1])) problems.push(`${slug}.md: no kata ${target}`);
        } else if (!/^\/(learn|glossary|drill|solve|community|scratchpad|notebook)?$/.test(route)) {
          problems.push(`${slug}.md: unknown link ${target}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("has only diagram blocks that are valid", async () => {
    const problems: string[] = [];
    for (const { slug, markdown } of await lessonFiles()) {
      for (const [, json] of markdown.matchAll(/^```diagram\n([\s\S]*?)^```$/gm)) {
        let spec: unknown;
        try {
          spec = JSON.parse(json);
        } catch (error) {
          problems.push(`${slug}.md: diagram is not JSON: ${(error as Error).message}`);
          continue;
        }
        const result = diagramSchema.safeParse(spec);
        if (!result.success) {
          problems.push(
            `${slug}.md: diagram: ${result.error.issues[0].path.join(".")} ${result.error.issues[0].message}`,
          );
          continue;
        }
        const ids = new Set([
          ...result.data.nodes.map((node) => node.id),
          ...(result.data.groups ?? []).map((group) => group.id),
        ]);
        for (const edge of result.data.edges)
          if (!ids.has(edge.from) || !ids.has(edge.to))
            problems.push(`${slug}.md: diagram arrow ${edge.from}>${edge.to} has an unknown end`);
      }
    }
    expect(problems).toEqual([]);
  });
});
