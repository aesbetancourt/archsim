import { describe, expect, it } from "vitest";
import { search, type SearchItem, stem } from "@/lib/content/search";

const items: SearchItem[] = [
  { kind: "Question", title: "How do you cache a hot key?", href: "/q" },
  { kind: "Lesson", title: "Caching", subtitle: "Where to put a cache", href: "/learn/caching" },
  { kind: "Term", title: "Cache stampede", subtitle: "Many misses at once", href: "/glossary#s" },
  { kind: "Section", title: "Rules for retries", subtitle: "Design for failure", href: "/r" },
  { kind: "Kata", title: "Lunch Rush", keywords: "orders peak", href: "/kata/lunch-rush" },
];

describe("search", () => {
  it("ranks a title that starts with the word first", () => {
    expect(search(items, "cach").map((item) => item.title)).toEqual([
      "Caching",
      "Cache stampede",
      "How do you cache a hot key?",
    ]);
  });

  it("needs every word, and finds words in the keywords and the subtitle", () => {
    expect(search(items, "cache stampede").map((item) => item.title)).toEqual(["Cache stampede"]);
    expect(search(items, "peak").map((item) => item.title)).toEqual(["Lunch Rush"]);
    expect(search(items, "misses").map((item) => item.title)).toEqual(["Cache stampede"]);
  });

  it("matches related word forms, and returns nothing for an empty query", () => {
    expect(search(items, "retry").map((item) => item.title)).toEqual(["Rules for retries"]);
    expect(search(items, "   ")).toEqual([]);
  });
});

describe("stem", () => {
  it("removes plural and -y ends, so related words match", () => {
    expect("retries").toContain(stem("retry"));
    expect("retry").toContain(stem("retries"));
    expect("cache").toContain(stem("caches"));
    expect(stem("saga")).toBe("saga");
  });
});
