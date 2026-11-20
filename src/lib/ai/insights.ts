import { z } from "zod";
import { object, text, textList } from "./json-schema";
import { escapeHtml } from "@/lib/text";

// An insights document: the AI reads all the marks of the notebook and writes a study document.
// The marks are the bookmarks, the highlights with their notes, the page notes, and the general
// notes. An earlier insights document is not a mark, so the AI does not summarize a summary.

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

const paragraph = (value: string) => `<p>${escapeHtml(value)}</p>`;
const list = (items: string[]) =>
  `<ul>${items.map((item) => `<li><p>${escapeHtml(item)}</p></li>`).join("")}</ul>`;

// Draw the insights as HTML for the notes editor. A section with no content is left out.
export function insightsHtml(insights: Insights, byline: string): string {
  const parts = [`<p><em>${escapeHtml(byline)}</em></p>`];
  const section = (title: string, body: string) => parts.push(`<h2>${title}</h2>${body}`);

  if (insights.big_picture.length) {
    section("The big picture", insights.big_picture.map(paragraph).join(""));
  }
  if (insights.key_ideas.length) {
    const ideas = insights.key_ideas.map(
      (item) =>
        `<h3>${escapeHtml(item.idea)}</h3>` +
        (item.quote.trim() ? `<blockquote>${paragraph(item.quote)}</blockquote>` : "") +
        paragraph(item.explanation) +
        `<p><em>From ${escapeHtml(item.lesson)}</em></p>`,
    );
    section("Key ideas", ideas.join(""));
  }
  if (insights.connections.length) section("How the ideas connect", list(insights.connections));
  if (insights.your_notes.length) section("What your notes add", list(insights.your_notes));
  if (insights.gaps.length) section("Gaps to check", list(insights.gaps));
  if (insights.review_questions.length) {
    const questions = insights.review_questions.map(
      (item) =>
        `<li><p><strong>${escapeHtml(item.question)}</strong></p>${paragraph(item.answer)}</li>`,
    );
    section("Review questions", `<ol>${questions.join("")}</ol>`);
  }
  return parts.join("");
}
