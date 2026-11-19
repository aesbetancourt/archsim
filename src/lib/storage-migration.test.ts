import { describe, expect, it } from "vitest";
import { migrateStorage, migrationScript } from "./storage-migration";

// A small Storage in memory, with the same methods as localStorage.
function memoryStorage(entries: Record<string, string>): Storage {
  const data = new Map(Object.entries(entries));
  return {
    get length() {
      return data.size;
    },
    key: (index: number) => [...data.keys()][index] ?? null,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
  };
}

const contents = (storage: Storage) =>
  Object.fromEntries(
    Array.from({ length: storage.length }, (_, index) => storage.key(index) as string).map(
      (key) => [key, storage.getItem(key)],
    ),
  );

describe("migrateStorage", () => {
  it("moves each old key to the new name and keeps other keys", () => {
    const storage = memoryStorage({
      "archsim:draft:lunch-rush": "draft",
      "archsim-read-rate": "1.5",
      theme: "dark",
    });
    migrateStorage(storage);
    expect(contents(storage)).toEqual({
      "charrette:draft:lunch-rush": "draft",
      "charrette-read-rate": "1.5",
      theme: "dark",
    });
  });

  it("keeps a value that exists with the new name already", () => {
    const storage = memoryStorage({ "archsim:drill": "old", "charrette:drill": "new" });
    migrateStorage(storage);
    expect(contents(storage)).toEqual({ "charrette:drill": "new" });
  });

  it("is a script that does not fail without storage", () => {
    expect(() => new Function(migrationScript)()).not.toThrow();
  });
});
