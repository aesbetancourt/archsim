import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { timeId } from "@/lib/random-id";

/**
 * A board is a free workspace: one diagram and notes. It is not tied to a kata.
 * It is saved in data/boards/<id>.json.
 */
export type Board = {
  id: string;
  title: string;
  notes: string;
  // The Excalidraw drawing: its elements and its embedded image files.
  scene: { elements: unknown[]; files: Record<string, unknown> };
  createdAt: string;
  updatedAt: string;
};

const ROOT = path.join(process.cwd(), "data", "boards");

// A board ID becomes a file name. Reject all other shapes.
function boardFile(id: string): string {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error("Invalid board ID.");
  return path.join(ROOT, `${id}.json`);
}

/**
 * Read one board from data/boards/<id>.json.
 * @param id The ID of the board.
 * @returns The board, or undefined when the ID is not valid or the board does not exist.
 * @example
 * const board = await getBoard(id);
 */
export async function getBoard(id: string): Promise<Board | undefined> {
  try {
    return JSON.parse(await readFile(boardFile(id), "utf8"));
  } catch {
    return undefined;
  }
}

/**
 * Return all boards in data/boards/, the most recently changed first.
 * @returns The boards. The list is empty when there are none.
 * @example
 * const boards = await listBoards();
 */
export async function listBoards(): Promise<Board[]> {
  const files = await readdir(ROOT).catch(() => []);
  const boards = await Promise.all(files.map((file) => getBoard(file.replace(/\.json$/, ""))));
  return boards
    .filter((board): board is Board => board !== undefined)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function write(board: Board): Promise<void> {
  await mkdir(ROOT, { recursive: true });
  await writeFile(boardFile(board.id), JSON.stringify(board));
}

/**
 * Make an empty board with the title "Untitled board", and write it to data/boards/.
 * @returns The new board.
 * @throws When the app cannot write the file.
 * @example
 * const { id } = await createBoard();
 */
export async function createBoard(): Promise<Board> {
  const now = new Date().toISOString();
  const board: Board = {
    id: timeId(),
    title: "Untitled board",
    notes: "",
    scene: { elements: [], files: {} },
    createdAt: now,
    updatedAt: now,
  };
  await write(board);
  return board;
}

/**
 * Change the title, the notes, and the drawing of a board in data/boards/<id>.json.
 * An empty title becomes "Untitled board".
 * @param id The ID of the board.
 * @param change The new title, notes, and drawing.
 * @returns The changed board, or undefined when the board does not exist.
 * @throws When the app cannot write the file.
 * @example
 * const board = await updateBoard(id, { title, notes, scene });
 */
export async function updateBoard(
  id: string,
  change: Pick<Board, "title" | "notes" | "scene">,
): Promise<Board | undefined> {
  const board = await getBoard(id);
  if (!board) return undefined;
  const next: Board = {
    ...board,
    title: change.title.trim() || "Untitled board",
    notes: change.notes,
    scene: change.scene,
    updatedAt: new Date().toISOString(),
  };
  await write(next);
  return next;
}

/**
 * Remove a board: its file in data/boards/. A board that does not exist is not an error.
 * @param id The ID of the board.
 * @throws When the ID is not valid.
 * @example
 * await deleteBoard(id);
 */
export async function deleteBoard(id: string): Promise<void> {
  await rm(boardFile(id), { force: true });
}
