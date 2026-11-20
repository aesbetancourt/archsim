import { describe, expect, it } from "vitest";
import type { WikiPage } from "./wiki-pages";
import { sectionTree } from "./wiki-tree";

const page = (slug: string, title: string, parent?: string): WikiPage => ({
  slug,
  title,
  summary: "",
  kind: "article",
  parent,
});

const pages = [
  page("modularity", "Modularity"),
  page("styles", "Architecture styles"),
  page("layered", "Layered", "styles"),
  page("microkernel", "Microkernel", "styles"),
  page("blocks", "Building blocks"),
];

const shape = (words?: string) =>
  sectionTree(pages, words).map((node) => [
    node.page.slug,
    node.children.map((child) => child.slug),
  ]);

describe("sectionTree", () => {
  it("puts each child under its parent and keeps the order", () => {
    expect(shape()).toEqual([
      ["modularity", []],
      ["styles", ["layered", "microkernel"]],
      ["blocks", []],
    ]);
  });

  it("keeps the parent of a child that matches", () => {
    expect(shape("layer")).toEqual([["styles", ["layered"]]]);
  });

  it("keeps all children of a parent that matches", () => {
    expect(shape("STYLES")).toEqual([["styles", ["layered", "microkernel"]]]);
  });

  it("returns nothing when no title matches", () => {
    expect(shape("queue")).toEqual([]);
  });
});

describe("lessonMeta", () => {
  it("has a level and objectives for each Learn page", async () => {
    const { wikiPages } = await import("./wiki");
    const { lessonMeta } = await import("./lesson-meta");
    const missing = wikiPages.filter((item) => !lessonMeta[item.slug]?.objectives.length);
    expect(missing.map((item) => item.slug)).toEqual([]);
    expect(Object.keys(lessonMeta).sort()).toEqual(wikiPages.map((item) => item.slug).sort());
  });
});

describe("readingMinutes", () => {
  it("counts words at 200 a minute, with one minute at least", async () => {
    const { readingMinutes } = await import("./wiki");
    const article = { slug: "x", title: "X", summary: "", kind: "article" } as const;
    expect(readingMinutes(article, "word ".repeat(1000))).toBe(5);
    expect(readingMinutes(article, "short")).toBe(1);
  });
});

describe("readingMinutes with a walkthrough", () => {
  it("counts the step text of a walkthrough, not its JSON", async () => {
    const { readingMinutes } = await import("./wiki");
    const article = { slug: "x", title: "X", summary: "", kind: "article" } as const;
    const steps = Array.from({ length: 10 }, () => ({ title: "t", text: "word ".repeat(99) }));
    const json = JSON.stringify({ diagram: { nodes: "x ".repeat(5000) }, steps });
    expect(readingMinutes(article, "```walkthrough\n" + json + "\n```\n")).toBe(5);
  });
});
