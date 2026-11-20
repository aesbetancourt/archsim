import { describe, expect, it } from "vitest";
import { attemptDir, overallScore } from "./attempts";
import type { Review } from "@/lib/ai/rubric";

const withScores = (...scores: number[]) =>
  ({ dimensions: scores.map((score) => ({ score })) }) as unknown as Review;

describe("attemptDir", () => {
  it.each(["../settings", "a/b", "", "UPPER", "a.json"])("rejects the ID %j", (id) => {
    expect(() => attemptDir(id)).toThrow("Invalid attempt ID.");
  });

  it("accepts a generated ID", () => {
    expect(attemptDir("1763300000000-abc123")).toMatch(/attempts\/1763300000000-abc123$/);
  });
});

describe("overallScore", () => {
  it("maps the mean score from 1 to 5 onto 0 to 100", () => {
    expect(overallScore(withScores(1, 1))).toBe(0);
    expect(overallScore(withScores(5, 5))).toBe(100);
    expect(overallScore(withScores(3, 4))).toBe(63);
  });

  it("returns 0 when there are no dimensions", () => {
    expect(overallScore(withScores())).toBe(0);
  });
});
