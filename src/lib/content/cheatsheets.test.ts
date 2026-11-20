import { describe, expect, it } from "vitest";
import { readCheatsheets } from "./cheatsheets";
import { wikiSections } from "./wiki-pages";

describe("cheatsheets", () => {
  // A wrong lesson or heading in a file throws, so this test also checks each link.
  it("has a valid cheatsheet for each section, with links to real lessons", async () => {
    const sheets = await readCheatsheets();
    expect(sheets.map((sheet) => sheet.section)).toEqual(
      wikiSections.map((section) => section.title),
    );
    for (const sheet of sheets) {
      expect(sheet.blocks.length).toBeGreaterThan(0);
    }
  });
});
