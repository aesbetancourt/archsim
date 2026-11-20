import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { timeId } from "@/lib/random-id";

// The changes to each file run one after the other, so two changes at the same time do not lose
// one of them. The queues are on globalThis: in development, a code reload can load this module
// two times, and the two copies must use the same queues.
const shared = globalThis as { charretteFileQueues?: Map<string, Promise<unknown>> };
const queues = (shared.charretteFileQueues ??= new Map());

// A JSON file in the data folder. Git ignores that folder.
export function jsonFile<T>(name: string, normalize: (saved: unknown) => T) {
  // Read the folder on each call, so a test can use a different working folder.
  const file = () => path.join(process.cwd(), "data", name);

  async function read(): Promise<T> {
    try {
      return normalize(JSON.parse(await readFile(file(), "utf8")));
    } catch {
      // There is no file yet, or the file is damaged. Start with the empty value.
      return normalize(undefined);
    }
  }

  function change<R>(apply: (value: T) => R): Promise<R> {
    const target = file();
    const next = (queues.get(target) ?? Promise.resolve()).then(async () => {
      const value = await read();
      const result = apply(value);
      await mkdir(path.dirname(target), { recursive: true });
      // Write a new file, then replace the old one. A stop during the write does not damage it.
      const temporary = `${target}.${timeId()}.tmp`;
      await writeFile(temporary, JSON.stringify(value, null, 2));
      await rename(temporary, target);
      return result;
    });
    queues.set(
      target,
      next.catch(() => undefined),
    );
    return next;
  }

  return { read, change };
}
