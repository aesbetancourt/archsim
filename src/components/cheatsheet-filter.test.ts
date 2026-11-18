import { describe, expect, it } from "vitest";
import { stem } from "./CheatsheetView";

describe("stem", () => {
  it("removes plural and -y ends, so related words match", () => {
    expect("retries").toContain(stem("retry"));
    expect("retry").toContain(stem("retries"));
    expect("cache").toContain(stem("caches"));
    expect(stem("saga")).toBe("saga");
  });
});
