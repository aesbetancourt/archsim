import { z } from "zod";
import type { Notebook } from "./notebook";
import { notesText } from "./notes";
import { headingId } from "./wiki-pages";

// An insights document: the AI reads all the marks of the notebook and writes a study document.
// The marks are the bookmarks, the highlights with their notes, the page notes, and the general
// notes. An earlier insights document is not a mark, so the AI does not summarize a summary.

// The longest text of one bookmarked section in the prompt, and of all the sections together.
// The marks themselves are always in the prompt.
const MAX_SECTION = 4_000;
const MAX_SECTIONS = 120_000;

// The text of one "## " section of a lesson, up to the next section.
export function sectionText(markdown: string, anchor: string): string {
  const lines = markdown.split("\n");
  const start = lines.findIndex(
    (line) => line.startsWith("## ") && headingId(line.slice(3).trim()) === anchor,
  );
  if (start < 0) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n").trim();
}

type Lesson = {
  title: string;
  slug?: string;
  bookmarks: { heading: string; anchor: string }[];
  highlights: { text: string; note: string; start: number }[];
  note: string;
};

export type InsightsCounts = { bookmarks: number; highlights: number; notes: number };

// Write the prompt from the notebook. The articles are the Markdown texts of the lessons, by slug.
// Return null when the notebook has nothing to read.
export function buildInsightsPrompt(
  notebook: Notebook,
  articles: Record<string, string>,
): { prompt: string; counts: InsightsCounts } | null {
  const lessons = new Map<string, Lesson>();
  const lesson = (page: string, title: string) => {
    const slug = page.match(/^\/learn\/([a-z0-9-]+)$/)?.[1];
    const found = lessons.get(page) ?? { title, slug, bookmarks: [], highlights: [], note: "" };
    lessons.set(page, found);
    return found;
  };
  for (const item of notebook.bookmarks) lesson(item.page, item.title).bookmarks.push(item);
  for (const item of notebook.highlights) lesson(item.page, item.title).highlights.push(item);
  for (const item of notebook.pages) {
    const text = notesText(item.html);
    if (text) lesson(item.page, item.title).note = text;
  }
  const generalNotes = notebook.documents
    .filter((item) => item.kind !== "insights")
    .map((item) => ({ title: item.title, text: notesText(item.html) }))
    .filter((item) => item.text);

  const counts: InsightsCounts = {
    bookmarks: notebook.bookmarks.length,
    highlights: notebook.highlights.length,
    notes: [...lessons.values()].filter((item) => item.note).length + generalNotes.length,
  };
  if (counts.bookmarks + counts.highlights + counts.notes === 0) return null;

  let budget = MAX_SECTIONS;
  const parts: string[] = [];
  for (const [page, item] of lessons) {
    const markdown = item.slug ? articles[item.slug] : undefined;
    parts.push(`<lesson title="${item.title}" page="${page}">`);
    for (const mark of item.bookmarks) {
      if (!mark.anchor) {
        const sections = markdown ? [...markdown.matchAll(/^## (.+)$/gm)].map((m) => m[1]) : [];
        parts.push(
          `<bookmark of="the whole lesson">Sections: ${sections.join("; ") || "unknown"}</bookmark>`,
        );
        continue;
      }
      let text = markdown ? sectionText(markdown, mark.anchor) : "";
      if (text.length > MAX_SECTION) text = `${text.slice(0, MAX_SECTION)} …`;
      if (text.length > budget) text = "(The section text is not included, to keep the size.)";
      budget -= text.length;
      parts.push(`<bookmark section="${mark.heading}">\n${text}\n</bookmark>`);
    }
    for (const mark of [...item.highlights].sort((a, b) => a.start - b.start)) {
      const note = mark.note.trim() ? `\n<my_note>${mark.note.trim()}</my_note>` : "";
      parts.push(`<highlight>\n${mark.text.trim()}${note}\n</highlight>`);
    }
    if (item.note) parts.push(`<page_notes>\n${item.note}\n</page_notes>`);
    parts.push("</lesson>");
  }
  for (const note of generalNotes) {
    parts.push(`<general_note title="${note.title}">\n${note.text}\n</general_note>`);
  }

  const prompt = `Write the insights document for these marks from my notebook.\n\n<notebook>\n${parts.join("\n")}\n</notebook>`;
  return { prompt, counts };
}

const insightsOutput = z.object({
  title: z.string(),
  big_picture: z.array(z.string()),
  key_ideas: z.array(
    z.object({ idea: z.string(), lesson: z.string(), quote: z.string(), explanation: z.string() }),
  ),
  connections: z.array(z.string()),
  your_notes: z.array(z.string()),
  gaps: z.array(z.string()),
  review_questions: z.array(z.object({ question: z.string(), answer: z.string() })),
});

export type Insights = z.infer<typeof insightsOutput>;

const text = { type: "string" };
const textList = { type: "array", items: text };
const object = (properties: Record<string, object>) => ({
  type: "object",
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});

// The output of the model must match this schema, with each provider.
export const insightsSchema = object({
  title: text,
  big_picture: textList,
  key_ideas: {
    type: "array",
    items: object({ idea: text, lesson: text, quote: text, explanation: text }),
  },
  connections: textList,
  your_notes: textList,
  gaps: textList,
  review_questions: { type: "array", items: object({ question: text, answer: text }) },
});

export function parseInsights(output: unknown): Insights {
  const result = insightsOutput.safeParse(output);
  if (!result.success) {
    throw new Error("The model returned the insights in the wrong form. Try again.");
  }
  return result.data;
}

export const insightsSystemPrompt = `You are a senior software architect and a patient teacher. A person studies software architecture for job interviews. While they read the lessons, they marked what matters to them: bookmarks on sections, highlights of passages with their own notes, notes on a page, and general notes. You read all of these marks and write one study document that helps them review, understand, and remember what they marked.

Use only the marks and the lesson text that comes with them. Do not add topics that the marks do not touch. When the lesson text and a note of the person disagree, say so in the gaps, and say which one is correct.

Write in plain, direct English. Use short sentences. Explain each term the first time you use it. Write to the person as "you".

Fill each field:
- title: a short name for what the marks cover, for example "Caching and consistency". Do not write "Insights".
- big_picture: two or three short paragraphs. Say what the marks are about as a whole, and why it matters in a design interview.
- key_ideas: one entry for each important idea in the marks, in an order that builds understanding. "lesson" is the title of the lesson it comes from. "quote" is the exact words of a highlight that shows the idea, or an empty string. "explanation" says the idea clearly in two to four sentences, with a small example when it helps.
- connections: how the ideas relate to each other, also across lessons. Each item names the ideas and the link between them, for example a trade-off they share. Use an empty list when there is only one idea.
- your_notes: what the person's own notes add, said more clearly. Correct a note that is wrong. Use an empty list when there are no notes.
- gaps: what the person marked but did not explain, and what they must check again. Each item says what to do, for example "Explain in your own words when write-back loses data."
- review_questions: five to ten questions that an interviewer could ask about these marks, from easy to hard. Give each one a short answer of two to four sentences.`;

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const paragraph = (value: string) => `<p>${escape(value)}</p>`;
const list = (items: string[]) =>
  `<ul>${items.map((item) => `<li><p>${escape(item)}</p></li>`).join("")}</ul>`;

// Draw the insights as HTML for the notes editor. A section with no content is left out.
export function insightsHtml(insights: Insights, byline: string): string {
  const parts = [`<p><em>${escape(byline)}</em></p>`];
  const section = (title: string, body: string) => parts.push(`<h2>${title}</h2>${body}`);

  if (insights.big_picture.length) {
    section("The big picture", insights.big_picture.map(paragraph).join(""));
  }
  if (insights.key_ideas.length) {
    const ideas = insights.key_ideas.map(
      (item) =>
        `<h3>${escape(item.idea)}</h3>` +
        (item.quote.trim() ? `<blockquote>${paragraph(item.quote)}</blockquote>` : "") +
        paragraph(item.explanation) +
        `<p><em>From ${escape(item.lesson)}</em></p>`,
    );
    section("Key ideas", ideas.join(""));
  }
  if (insights.connections.length) section("How the ideas connect", list(insights.connections));
  if (insights.your_notes.length) section("What your notes add", list(insights.your_notes));
  if (insights.gaps.length) section("Gaps to check", list(insights.gaps));
  if (insights.review_questions.length) {
    const questions = insights.review_questions.map(
      (item) =>
        `<li><p><strong>${escape(item.question)}</strong></p>${paragraph(item.answer)}</li>`,
    );
    section("Review questions", `<ol>${questions.join("")}</ol>`);
  }
  return parts.join("");
}
