import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDocument,
  deleteDocument,
  readNotebook,
  savePageNote,
  updateDocument,
} from "./notebook";

let dir: string;

// Each test uses a new data folder.
beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "charrette-notebook-"));
  vi.spyOn(process, "cwd").mockReturnValue(dir);
});

describe("notebook", () => {
  it("keeps the notes of an older notebook as the first general note", async () => {
    await mkdir(path.join(dir, "data"));
    await writeFile(
      path.join(dir, "data", "notebook.json"),
      JSON.stringify({ notes: "<p>old</p>", highlights: [] }),
    );

    const notebook = await readNotebook();

    expect(notebook.documents).toHaveLength(1);
    expect(notebook.documents[0]).toMatchObject({ title: "General notes", html: "<p>old</p>" });
  });

  it("does not keep the older notes twice after a save", async () => {
    await mkdir(path.join(dir, "data"));
    await writeFile(
      path.join(dir, "data", "notebook.json"),
      JSON.stringify({ notes: "<p>old</p>" }),
    );

    await createDocument("Questions");

    const saved = JSON.parse(await readFile(path.join(dir, "data", "notebook.json"), "utf8"));
    expect(saved.notes).toBeUndefined();
    expect(saved.documents.map((item: { title: string }) => item.title)).toEqual([
      "General notes",
      "Questions",
    ]);
  });

  it("creates, renames, and deletes a general note", async () => {
    const created = await createDocument("  ");
    expect(created.title).toBe("Untitled note");

    const updated = await updateDocument(created.id, { title: "Caching", html: "<p>x</p>" });
    expect(updated).toMatchObject({ title: "Caching", html: "<p>x</p>" });

    await deleteDocument(created.id);
    expect((await readNotebook()).documents).toEqual([]);
  });

  it("replaces the notes of a page, and removes empty notes", async () => {
    await savePageNote({ page: "/learn/caching", title: "Caching", html: "<p>a</p>" });
    await savePageNote({ page: "/learn/caching", title: "Caching", html: "<p>b</p>" });
    expect((await readNotebook()).pages.map((item) => item.html)).toEqual(["<p>b</p>"]);

    await savePageNote({ page: "/learn/caching", title: "Caching", html: "" });
    expect((await readNotebook()).pages).toEqual([]);
  });
});

describe("story bank", () => {
  it("creates, updates, and deletes a story, and keeps only known competencies", async () => {
    const { createStory, updateStory, deleteStory } = await import("./notebook");
    const fields = {
      title: " ",
      situation: "S",
      task: "T",
      action: "A",
      result: "R",
      reflection: "L",
      competencies: ["Saying no", "Not a competency"],
    };
    const story = await createStory(fields);
    expect(story).toMatchObject({ title: "Untitled story", competencies: ["Saying no"] });

    const updated = await updateStory(story.id, { ...fields, title: "The checkout freeze" });
    expect(updated?.title).toBe("The checkout freeze");

    await deleteStory(story.id);
    expect((await readNotebook()).stories).toEqual([]);
  });
});
