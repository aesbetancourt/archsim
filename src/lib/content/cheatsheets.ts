import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getLesson, headings, readArticle } from "./lesson-reader";
import { headingId, lessonSections } from "./lessons";
import { route } from "@/lib/routes";

// A cheatsheet is a fast review of one section of the Learn area. Each section has a JSON file
// in content/cheatsheets. Each entry links to the lesson where the fact is.

const lesson = z.string().regex(/^[a-z0-9-]+(#[a-z0-9-]+)?$/, "must be a slug or slug#heading");

const blockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("choose"),
    title: z.string(),
    items: z.array(z.object({ when: z.string(), use: z.string(), lesson })).min(1),
  }),
  z.object({
    type: z.literal("rules"),
    title: z.string(),
    items: z.array(z.object({ text: z.string(), lesson })).min(1),
  }),
  z.object({
    type: z.literal("numbers"),
    title: z.string(),
    items: z
      .array(
        z.object({ label: z.string(), value: z.string(), note: z.string().optional(), lesson }),
      )
      .min(1),
  }),
  z.object({
    type: z.literal("table"),
    title: z.string(),
    columns: z.array(z.string()).min(2),
    rows: z.array(z.array(z.string())).min(1),
    lesson,
  }),
]);

const sheetSchema = z.object({
  section: z.string(),
  summary: z.string(),
  blocks: z.array(blockSchema).min(1),
});

// A link to a lesson, ready to draw.
export type LessonLink = { href: string; title: string };

type Block = z.infer<typeof blockSchema>;

// The same block, with each lesson reference changed to a link.
export type SheetBlock =
  | (Omit<Extract<Block, { type: "choose" }>, "items"> & {
      items: { when: string; use: string; link: LessonLink }[];
    })
  | (Omit<Extract<Block, { type: "rules" }>, "items"> & {
      items: { text: string; link: LessonLink }[];
    })
  | (Omit<Extract<Block, { type: "numbers" }>, "items"> & {
      items: { label: string; value: string; note?: string; link: LessonLink }[];
    })
  | (Omit<Extract<Block, { type: "table" }>, "lesson"> & { link: LessonLink });

export type Cheatsheet = {
  id: string;
  section: string;
  summary: string;
  // The slugs of the lessons in the section, for the progress of the reader.
  slugs: string[];
  blocks: SheetBlock[];
};

// Change "slug#heading" to a link. Throw if the lesson or the heading does not exist, so a
// wrong reference fails the tests and the build, not the reader.
async function linkTo(reference: string, file: string): Promise<LessonLink> {
  const [slug, heading] = reference.split("#");
  const page = getLesson(slug);
  if (!page) throw new Error(`${file}: unknown lesson "${slug}"`);
  if (heading) {
    const markdown = await readArticle(slug);
    const found = markdown && headings(markdown).find((text) => headingId(text) === heading);
    if (!found) throw new Error(`${file}: lesson "${slug}" has no heading "${heading}"`);
    return { href: route(`/learn/${slug}#${heading}`), title: `${page.title}: ${found}` };
  }
  return { href: route(`/learn/${slug}`), title: page.title };
}

async function resolveBlock(block: Block, file: string): Promise<SheetBlock> {
  const link = (reference: string) => linkTo(reference, file);
  switch (block.type) {
    case "choose":
      return {
        ...block,
        items: await Promise.all(
          block.items.map(async ({ lesson, ...item }) => ({ ...item, link: await link(lesson) })),
        ),
      };
    case "rules":
      return {
        ...block,
        items: await Promise.all(
          block.items.map(async ({ lesson, ...item }) => ({ ...item, link: await link(lesson) })),
        ),
      };
    case "numbers":
      return {
        ...block,
        items: await Promise.all(
          block.items.map(async ({ lesson, ...item }) => ({ ...item, link: await link(lesson) })),
        ),
      };
    case "table": {
      const { lesson, ...table } = block;
      for (const row of table.rows)
        if (row.length !== table.columns.length)
          throw new Error(`${file}: a row of "${table.title}" has the wrong number of cells`);
      return { ...table, link: await link(lesson) };
    }
  }
}

// Read the cheatsheets of all sections, in the order of the sections. A section without a file
// has no cheatsheet.
export async function readCheatsheets(): Promise<Cheatsheet[]> {
  const sheets: Cheatsheet[] = [];
  for (const section of lessonSections) {
    const id = headingId(section.title);
    const file = `content/cheatsheets/${id}.json`;
    let raw: string;
    try {
      raw = await readFile(path.join(process.cwd(), file), "utf8");
    } catch {
      continue;
    }
    const result = sheetSchema.safeParse(JSON.parse(raw));
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new Error(`${file}: ${issue.path.join(".")}: ${issue.message}`);
    }
    if (result.data.section !== section.title)
      throw new Error(`${file}: the section must be "${section.title}"`);
    sheets.push({
      id,
      section: section.title,
      summary: result.data.summary,
      slugs: section.pages.map((page) => page.slug),
      blocks: await Promise.all(result.data.blocks.map((block) => resolveBlock(block, file))),
    });
  }
  return sheets;
}
