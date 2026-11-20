import { describe, expect, it } from "vitest";
import { insightsHtml } from "./insights";

describe("insightsHtml", () => {
  it("draws the sections and escapes the text", () => {
    const html = insightsHtml(
      {
        title: "Caching",
        big_picture: ["A <cache> is fast."],
        key_ideas: [{ idea: "Eviction", lesson: "Caching", quote: "", explanation: "LRU." }],
        connections: [],
        your_notes: [],
        gaps: ["TTL"],
        review_questions: [{ question: "Why?", answer: "Speed." }],
      },
      "Made today.",
    );

    expect(html).toContain("<h2>The big picture</h2>");
    expect(html).toContain("A &lt;cache&gt; is fast.");
    expect(html).not.toContain("How the ideas connect");
    expect(html).toContain("<strong>Why?</strong>");
  });
});
