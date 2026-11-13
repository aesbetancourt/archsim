// Make the canvas elements of a palette piece. This file uses Excalidraw, so it runs only in the browser.
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import { type Block, blockGroups, getBlock, type LinkKind } from "./blocks";

export const WIDTH = 180;
export const HEIGHT = 70;
// The height of the round end of a cylinder, and the width of the round end of a pipe.
const END = 22;
const FRAME_WIDTH = 460;
const FRAME_HEIGHT = 300;
const ARROW_LENGTH = 220;
// The distance between the pieces of a pattern.
const COLUMN = WIDTH + 110;
const ROW = HEIGHT + 80;
// The space between a piece and the end of an arrow.
const GAP = 16;
const TEXT_COLOR = "#1e1e1e";

type Skeleton = NonNullable<Parameters<typeof convertToExcalidrawElements>[0]>[number];
type Element = ReturnType<typeof convertToExcalidrawElements>[number];
// Data that the element builder of Excalidraw does not keep. It is set again after the build.
type Extra = { groupIds?: string[]; customData?: { decor?: boolean; boundary?: boolean } };

const lineStyle: Record<LinkKind, "solid" | "dashed" | "dotted"> = {
  call: "solid",
  message: "dashed",
  replication: "dotted",
};

const colorOf = (block: Block) => blockGroups.find((group) => group.id === block.group)?.color ?? "#ffffff";

// Collects the parts of one drop. Each part gets an ID that starts with the same random text.
class Builder {
  private uid = Math.random().toString(36).slice(2, 10);
  private count = 0;
  parts: Skeleton[] = [];
  extra = new Map<string, Extra>();

  id(key: string): string {
    return `${this.uid}-${key}`;
  }

  add(part: object, extra?: Extra, id = this.id(`part${this.count++}`)): string {
    this.parts.push({ ...part, id } as Skeleton);
    if (extra) this.extra.set(id, extra);
    return id;
  }

  // Add one component. The main shape has the name as its label and the given ID.
  component(block: Block, x: number, y: number, mainId: string) {
    const fill = { backgroundColor: colorOf(block), fillStyle: "solid" };
    // The label has its own color, because the body of a cylinder has no outline color to take.
    const label = { text: block.name, fontSize: 16, strokeColor: TEXT_COLOR };
    const group = { groupIds: [`${mainId}-group`] };
    const decor = { ...group, customData: { decor: true } };
    const line = (x1: number, y1: number, x2: number, y2: number) =>
      this.add({ type: "line", x: x1, y: y1, points: [[0, 0], [x2 - x1, y2 - y1]] }, decor);

    if (block.shape === "store") {
      // A cylinder: an ellipse at the bottom, a body with no outline, two sides, and an ellipse on top.
      this.add({ type: "ellipse", x, y: y + HEIGHT - END / 2, width: WIDTH, height: END, ...fill }, decor);
      this.add({ type: "rectangle", x, y, width: WIDTH, height: HEIGHT, ...fill, strokeColor: "transparent", roundness: null, label }, group, mainId);
      line(x, y, x, y + HEIGHT);
      line(x + WIDTH, y, x + WIDTH, y + HEIGHT);
      this.add({ type: "ellipse", x, y: y - END / 2, width: WIDTH, height: END, ...fill }, decor);
    } else if (block.shape === "pipe") {
      // A pipe: the same cylinder on its side.
      this.add({ type: "ellipse", x: x - END / 2, y, width: END, height: HEIGHT, ...fill }, decor);
      this.add({ type: "rectangle", x, y, width: WIDTH, height: HEIGHT, ...fill, strokeColor: "transparent", roundness: null, label }, group, mainId);
      line(x, y, x + WIDTH, y);
      line(x, y + HEIGHT, x + WIDTH, y + HEIGHT);
      this.add({ type: "ellipse", x: x + WIDTH - END / 2, y, width: END, height: HEIGHT, ...fill }, decor);
    } else if (block.shape === "person") {
      // A figure of a person, with the name in a box with no outline below it.
      const middle = x + WIDTH / 2;
      this.add({ type: "ellipse", x: middle - 9, y, width: 18, height: 18, ...fill }, decor);
      line(middle, y + 18, middle, y + 36);
      line(middle - 14, y + 25, middle + 14, y + 25);
      line(middle, y + 36, middle - 11, y + 50);
      line(middle, y + 36, middle + 11, y + 50);
      this.add(
        { type: "rectangle", x, y: y + 52, width: WIDTH, height: 30, backgroundColor: "transparent", strokeColor: "transparent", roundness: null, label },
        group,
        mainId,
      );
    } else if (block.shape === "device") {
      // A piece of hardware: a box with a short base line, like a screen.
      this.add({ type: "rectangle", x, y, width: WIDTH, height: HEIGHT, ...fill, roundness: { type: 3 }, label }, group, mainId);
      line(x + WIDTH / 2 - 26, y + HEIGHT + 8, x + WIDTH / 2 + 26, y + HEIGHT + 8);
    } else if (block.shape === "module") {
      // A module has square corners. A part that is deployed alone has round corners.
      this.add({ type: "rectangle", x, y, width: WIDTH, height: HEIGHT, ...fill, roundness: null, label }, undefined, mainId);
    } else if (block.shape === "actor") {
      this.add({ type: "ellipse", x, y, width: WIDTH, height: HEIGHT, ...fill, label }, undefined, mainId);
    } else {
      // A dashed outline is the usual sign for a system that is not yours.
      const strokeStyle = block.shape === "external" ? "dashed" : "solid";
      this.add({ type: "rectangle", x, y, width: WIDTH, height: HEIGHT, ...fill, roundness: { type: 3 }, strokeStyle, label }, undefined, mainId);
    }
  }

  // Add an arrow between two points. It attaches to the shapes with the given IDs.
  arrow(kind: LinkKind, from: [number, number], to: [number, number], startId?: string, endId?: string) {
    this.add({
      type: "arrow",
      x: from[0],
      y: from[1],
      width: to[0] - from[0],
      height: to[1] - from[1],
      points: [[0, 0], [to[0] - from[0], to[1] - from[1]]],
      strokeStyle: lineStyle[kind],
      ...(startId ? { start: { id: startId } } : {}),
      ...(endId ? { end: { id: endId } } : {}),
    });
  }

  build(): Element[] {
    const elements = convertToExcalidrawElements(this.parts, { regenerateIds: false });
    const withExtra = elements.map((element) => ({ ...element, ...this.extra.get(element.id) }));
    const byId = new Map(withExtra.map((element) => [element.id, element]));
    // A label is in the same group as its shape.
    return withExtra.map((element) => {
      const container = element.type === "text" && element.containerId ? byId.get(element.containerId) : undefined;
      return container?.groupIds.length ? { ...element, groupIds: container.groupIds } : element;
    }) as Element[];
  }
}

// The start and the end of an arrow between two pieces of a pattern, from their places in the grid.
function ends(from: { col: number; row: number }, to: { col: number; row: number }, origin: [number, number]) {
  const left = (cell: { col: number }) => origin[0] + cell.col * COLUMN;
  const top = (cell: { row: number }) => origin[1] + cell.row * ROW;
  if (from.col === to.col) {
    const down = to.row > from.row;
    const x = left(from) + WIDTH / 2;
    return {
      start: [x, down ? top(from) + HEIGHT + GAP : top(from) - GAP] as [number, number],
      end: [x, down ? top(to) - GAP : top(to) + HEIGHT + GAP] as [number, number],
    };
  }
  const right = to.col > from.col;
  if (from.row !== to.row) {
    // A diagonal arrow leaves from the bottom or the top, so it does not share a start with a straight one.
    const down = to.row > from.row;
    return {
      start: [left(from) + WIDTH / 2 + (right ? 40 : -40), down ? top(from) + HEIGHT + GAP : top(from) - GAP] as [number, number],
      end: [right ? left(to) - GAP : left(to) + WIDTH + GAP, top(to) + HEIGHT / 2] as [number, number],
    };
  }
  return {
    start: [right ? left(from) + WIDTH + GAP : left(from) - GAP, top(from) + HEIGHT / 2] as [number, number],
    end: [right ? left(to) - GAP : left(to) + WIDTH + GAP, top(to) + HEIGHT / 2] as [number, number],
  };
}

// The size of a piece on the canvas. The palette uses it to put the piece in the center.
export function sizeOf(block: Block): { width: number; height: number } {
  if (block.shape === "boundary") return { width: FRAME_WIDTH, height: FRAME_HEIGHT };
  if (block.shape === "pattern" && block.pattern) {
    const cols = Math.max(...block.pattern.pieces.map((piece) => piece.col));
    const rows = Math.max(...block.pattern.pieces.map((piece) => piece.row));
    return { width: cols * COLUMN + WIDTH, height: rows * ROW + HEIGHT };
  }
  if (block.shape === "call" || block.shape === "message" || block.shape === "replication") {
    return { width: ARROW_LENGTH, height: 0 };
  }
  return { width: WIDTH, height: HEIGHT };
}

// Make the elements of a piece, with its top left corner at the given point.
export function elementsFor(block: Block, x: number, y: number): Element[] {
  const builder = new Builder();
  if (block.shape === "call" || block.shape === "message" || block.shape === "replication") {
    builder.arrow(block.shape, [x, y], [x + ARROW_LENGTH, y]);
  } else if (block.shape === "boundary") {
    builder.add(
      {
        type: "rectangle",
        x,
        y,
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
        backgroundColor: "transparent",
        strokeStyle: "dashed",
        roundness: { type: 3 },
        label: { text: block.name, fontSize: 16, textAlign: "left", verticalAlign: "top", strokeColor: TEXT_COLOR },
      },
      { customData: { boundary: true } },
    );
  } else if (block.shape === "pattern" && block.pattern) {
    const { pieces, links } = block.pattern;
    for (const piece of pieces) {
      const part = getBlock(piece.block);
      if (part) builder.component(part, x + piece.col * COLUMN, y + piece.row * ROW, builder.id(piece.key));
    }
    for (const link of links) {
      const from = pieces.find((piece) => piece.key === link.from);
      const to = pieces.find((piece) => piece.key === link.to);
      if (!from || !to) continue;
      const { start, end } = ends(from, to, [x, y]);
      builder.arrow(link.kind, start, end, builder.id(from.key), builder.id(to.key));
    }
  } else {
    builder.component(block, x, y, builder.id("main"));
  }
  return builder.build();
}
