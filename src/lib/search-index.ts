import { readCheatsheets } from "./cheatsheets";
import { glossary } from "./glossary";
import { katas } from "./katas";
import { readQuestions } from "./questions";
import type { SearchItem } from "./search";
import { headings, readArticle, wikiPages } from "./wiki";
import { headingId, wikiSections } from "./wiki-pages";

// The pages of the app that are not lessons.
const appPages: SearchItem[] = [
  {
    kind: "Page",
    title: "Katas",
    subtitle: "Katas and interview questions, with a review",
    href: "/",
  },
  { kind: "Page", title: "All lessons", subtitle: "The Learn area", href: "/learn" },
  {
    kind: "Page",
    title: "Cheatsheets",
    subtitle: "The key facts of each section",
    href: "/learn/cheatsheets",
  },
  {
    kind: "Page",
    title: "Worked examples",
    subtitle: "Finished katas, step by step",
    href: "/learn/examples",
  },
  { kind: "Page", title: "Glossary", subtitle: "Terms in plain words", href: "/glossary" },
  {
    kind: "Page",
    title: "Vocabulary drill",
    subtitle: "Explain the terms",
    href: "/drill",
    keywords: "practice flashcards",
  },
  {
    kind: "Page",
    title: "Question drill",
    subtitle: "Answer the interview questions",
    href: "/drill/questions",
    keywords: "practice",
  },
  {
    kind: "Page",
    title: "Notebook",
    subtitle: "Notes, highlights, and the story bank",
    href: "/notebook",
    keywords: "notes highlights stories",
  },
  {
    kind: "Page",
    title: "Scratchpad",
    subtitle: "Free boards to draw and write",
    href: "/scratchpad",
    keywords: "board diagram",
  },
  {
    kind: "Page",
    title: "Solve a problem",
    subtitle: "Paste a problem and get a worked answer",
    href: "/solve",
  },
  {
    kind: "Page",
    title: "Architectural Katas",
    subtitle: "The collection of Ted Neward",
    href: "/community",
  },
  {
    kind: "Page",
    title: "Settings",
    subtitle: "The model connection",
    href: "/settings",
    keywords: "model provider api key",
  },
];

const firstSentence = (text: string) => text.split(/(?<=[.!?])\s/)[0];

const sectionOf = new Map(
  wikiSections.flatMap((section) =>
    section.pages.map((page) => [page.slug, section.title] as const),
  ),
);

// The search index of the content. The notes of the user are not in it: the browser adds them.
export async function buildSearchIndex(): Promise<SearchItem[]> {
  const items: SearchItem[] = [...appPages];

  for (const page of wikiPages) {
    const section = sectionOf.get(page.slug) ?? "";
    const isCase = section === "System design cases";
    items.push({
      kind: isCase ? "Case" : "Lesson",
      title: page.title,
      subtitle: page.summary,
      href: `/learn/${page.slug}`,
      keywords: section,
    });
    const markdown = await readArticle(page.slug);
    for (const heading of markdown ? headings(markdown) : []) {
      items.push({
        kind: "Section",
        title: heading,
        subtitle: page.title,
        href: `/learn/${page.slug}#${headingId(heading)}`,
      });
    }
  }

  for (const kata of katas) {
    items.push({
      kind: "Kata",
      title: kata.title,
      subtitle: firstSentence(kata.context),
      href: `/kata/${kata.id}`,
      keywords: kata.interview ? "interview" : "kata",
    });
  }

  for (const term of glossary) {
    items.push({
      kind: "Term",
      title: term.term,
      subtitle: term.definition,
      href: `/glossary#${term.id}`,
      keywords: term.category,
    });
  }

  for (const sheet of await readCheatsheets()) {
    items.push({
      kind: "Cheatsheet",
      title: `${sheet.section} cheatsheet`,
      subtitle: sheet.summary,
      href: `/learn/cheatsheets#${sheet.id}`,
      keywords: sheet.blocks.map((block) => block.title).join(" "),
    });
  }

  for (const question of await readQuestions()) {
    items.push({
      kind: "Question",
      title: question.question,
      subtitle: question.lesson,
      href: question.href,
    });
  }

  return items;
}
