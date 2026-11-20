import { describe, expect, it } from "vitest";
import { parseQuestions, readQuestions } from "@/lib/content/questions";
import { lessonSections } from "@/lib/content/lessons";

describe("parseQuestions", () => {
  it("reads both formats, and only in the question sections", () => {
    const markdown = [
      "## A section",
      "",
      "**Not a question, because the section is wrong**",
      "",
      "- no",
      "",
      "## Interview questions",
      "",
      '**"Why a cache?"**',
      "",
      "- Reads repeat.",
      "- The data can be a little old.",
      "",
      "1. **How does it fail?**",
      "   - A stampede.",
      "",
      "**A bold line with no list**",
      "",
      "## What interviewers probe",
      "",
      "**Why token bucket?**",
      "",
      "- Bursts.",
      "",
      "## Go deeper",
      "",
      "**Not this one**",
      "- no",
    ].join("\n");
    expect(parseQuestions(markdown)).toEqual([
      {
        heading: "Interview questions",
        question: "Why a cache?",
        points: ["Reads repeat.", "The data can be a little old."],
      },
      { heading: "Interview questions", question: "How does it fail?", points: ["A stampede."] },
      { heading: "What interviewers probe", question: "Why token bucket?", points: ["Bursts."] },
    ]);
  });
});

describe("readQuestions", () => {
  it("finds the questions of the lessons, with unique IDs and a known section", async () => {
    const questions = await readQuestions();
    // The lessons have about 380 questions. A big drop means the format changed.
    expect(questions.length).toBeGreaterThan(300);
    const ids = questions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
    const sections = new Set(lessonSections.map((section) => section.title));
    expect(questions.filter((question) => !sections.has(question.section))).toEqual([]);
  });

  it("finds questions in nearly each lesson", async () => {
    const questions = await readQuestions();
    const withQuestions = new Set(questions.map((question) => question.slug));
    const pages = lessonSections.flatMap((section) => section.pages.map((page) => page.slug));
    // Some pages have no question section: the reading list, and pages without Markdown.
    const without = pages.filter((slug) => !withQuestions.has(slug));
    expect(without.length).toBeLessThan(8);
  });
});
