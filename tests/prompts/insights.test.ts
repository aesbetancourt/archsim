import { describe, expect, it } from "vitest";
import type { Notebook } from "@/lib/store/notebook";
import { buildInsightsPrompt, sectionText } from "@/prompts/insights";

const lesson = `Intro text.

## Eviction

A cache removes old entries.

## Write-back

The cache writes later.
`;

const empty: Notebook = { documents: [], pages: [], highlights: [], bookmarks: [], stories: [] };
const at = "2026-11-19T10:00:00.000Z";

describe("sectionText", () => {
  it("returns the text of one section, up to the next section", () => {
    expect(sectionText(lesson, "eviction")).toBe("A cache removes old entries.");
  });

  it("returns nothing for an unknown section", () => {
    expect(sectionText(lesson, "missing")).toBe("");
  });
});

describe("buildInsightsPrompt", () => {
  it("returns nothing when the notebook has no marks", () => {
    expect(buildInsightsPrompt(empty, {})).toBeNull();
  });

  it("puts each kind of mark in the prompt, with the bookmarked section text", () => {
    const notebook: Notebook = {
      ...empty,
      bookmarks: [
        {
          id: "b",
          page: "/learn/caching",
          title: "Caching",
          heading: "Eviction",
          anchor: "eviction",
          createdAt: at,
        },
      ],
      highlights: [
        {
          id: "h",
          page: "/learn/caching",
          title: "Caching",
          text: "stale data",
          start: 0,
          note: "check TTL",
          createdAt: at,
        },
      ],
      pages: [
        { page: "/learn/caching", title: "Caching", html: "<p>my page note</p>", updatedAt: at },
      ],
      documents: [
        { id: "d", title: "Questions", html: "<p>why LRU?</p>", createdAt: at, updatedAt: at },
        {
          id: "i",
          title: "Insights · Old",
          html: "<p>old summary</p>",
          createdAt: at,
          updatedAt: at,
          kind: "insights",
        },
      ],
    };

    const result = buildInsightsPrompt(notebook, { caching: lesson });

    expect(result?.counts).toEqual({ bookmarks: 1, highlights: 1, notes: 2 });
    for (const part of [
      "A cache removes old entries.",
      "stale data",
      "check TTL",
      "my page note",
      "why LRU?",
    ]) {
      expect(result?.prompt).toContain(part);
    }
    expect(result?.prompt).not.toContain("old summary");
  });
});
