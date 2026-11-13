import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// A board is a free workspace: one diagram and notes. It is not tied to a kata.
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

export async function getBoard(id: string): Promise<Board | undefined> {
  try {
    return JSON.parse(await readFile(boardFile(id), "utf8"));
  } catch {
    return undefined;
  }
}

// Return all boards, the most recently changed first.
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

export async function createBoard(): Promise<Board> {
  const now = new Date().toISOString();
  const board: Board = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "Untitled board",
    notes: "",
    scene: { elements: [], files: {} },
    createdAt: now,
    updatedAt: now,
  };
  await write(board);
  return board;
}

export async function updateBoard(id: string, change: Pick<Board, "title" | "notes" | "scene">): Promise<Board | undefined> {
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

export async function deleteBoard(id: string): Promise<void> {
  await rm(boardFile(id), { force: true });
}
