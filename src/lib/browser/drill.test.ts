import { describe, expect, it } from "vitest";
import { dueTerms, review, type DrillProgress } from "./drill";

const day = 24 * 60 * 60 * 1000;
const now = new Date("2026-11-18T09:00:00.000Z");
const later = (days: number) => new Date(now.getTime() + days * day).toISOString();
const terms = ["a", "b", "c", "d"].map((id) => ({ id }));

describe("review", () => {
  it("moves a known term to the next box and waits longer each time", () => {
    const first = review(undefined, true, now);
    expect(first).toEqual({ box: 2, due: later(1) });

    const second = review(first, true, now);
    expect(second).toEqual({ box: 3, due: later(3) });
  });

  it("keeps a term in the last box when it is known again", () => {
    expect(review({ box: 5, due: later(0) }, true, now)).toEqual({ box: 5, due: later(14) });
  });

  it("sends a missed term back to the first box, due at once", () => {
    expect(review({ box: 4, due: later(0) }, false, now)).toEqual({ box: 1, due: later(0) });
  });
});

describe("dueTerms", () => {
  it("returns the due reviews first, the oldest first, then the new terms", () => {
    const progress: DrillProgress = {
      a: { box: 2, due: later(-1) },
      b: { box: 3, due: later(5) },
      c: { box: 2, due: later(-3) },
    };
    expect(dueTerms(terms, progress, now, 10).map((term) => term.id)).toEqual(["c", "a", "d"]);
  });

  it("limits the number of new terms in one session", () => {
    expect(dueTerms(terms, {}, now, 2).map((term) => term.id)).toEqual(["a", "b"]);
  });

  it("returns nothing when every term waits for a later day", () => {
    const progress: DrillProgress = Object.fromEntries(
      terms.map((term) => [term.id, { box: 2, due: later(1) }]),
    );
    expect(dueTerms(terms, progress, now, 10)).toHaveLength(0);
  });
});
