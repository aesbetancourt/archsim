import type { DiagramSpec } from "@/lib/examples";

const CELL_W = 270;
const CELL_H = 110;
const BOX_W = 170;
const BOX_H = 56;
const PAD = 40;
const GROUP_PAD = 18;
const GROUP_HEADER = 22;

type Rect = { cx: number; cy: number; hw: number; hh: number };

function cellCenter(col: number, row: number) {
  return { cx: PAD + BOX_W / 2 + col * CELL_W, cy: PAD + BOX_H / 2 + row * CELL_H };
}

// Find the point where a line from the rectangle center meets its border.
function borderPoint(rect: Rect, dx: number, dy: number) {
  const scale = Math.min(
    dx === 0 ? Infinity : rect.hw / Math.abs(dx),
    dy === 0 ? Infinity : rect.hh / Math.abs(dy),
  );
  return { x: rect.cx + dx * scale, y: rect.cy + dy * scale };
}

// Draw a box-and-arrow diagram from a grid description.
export default function Diagram({ spec }: { spec: DiagramSpec }) {
  const rects = new Map<string, Rect>();
  for (const node of spec.nodes) {
    rects.set(node.id, { ...cellCenter(node.col, node.row), hw: BOX_W / 2, hh: BOX_H / 2 });
  }
  const groups = (spec.groups ?? []).map((group) => {
    const first = cellCenter(group.col, group.row);
    const last = cellCenter(group.col + group.cols - 1, group.row + group.rows - 1);
    const left = first.cx - BOX_W / 2 - GROUP_PAD;
    const right = last.cx + BOX_W / 2 + GROUP_PAD;
    const top = first.cy - BOX_H / 2 - GROUP_PAD - GROUP_HEADER;
    const bottom = last.cy + BOX_H / 2 + GROUP_PAD;
    rects.set(group.id, {
      cx: (left + right) / 2,
      cy: (top + bottom) / 2,
      hw: (right - left) / 2,
      hh: (bottom - top) / 2,
    });
    return { ...group, left, top, width: right - left, height: bottom - top };
  });

  const all = [...rects.values()];
  const width = Math.max(...all.map((rect) => rect.cx + rect.hw)) + PAD;
  const height = Math.max(...all.map((rect) => rect.cy + rect.hh)) + PAD;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mx-auto block w-full rounded-md border bg-card"
      style={{ maxWidth: width }}
      role="img"
      aria-label="Architecture diagram"
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="fill-foreground/70" />
        </marker>
      </defs>

      {groups.map((group) => (
        <g key={group.id}>
          <rect
            x={group.left}
            y={group.top}
            width={group.width}
            height={group.height}
            rx={10}
            className="fill-primary/5 stroke-primary"
            strokeWidth={1.5}
          />
          <text x={group.left + 12} y={group.top + 18} fontSize={12} fontWeight={600} className="fill-primary">
            {group.label}
          </text>
        </g>
      ))}

      {spec.edges.map((edge, index) => {
        const from = rects.get(edge.from);
        const to = rects.get(edge.to);
        if (!from || !to) return null;
        const dx = to.cx - from.cx;
        const dy = to.cy - from.cy;
        const start = borderPoint(from, dx, dy);
        const end = borderPoint(to, -dx, -dy);
        return (
          <g key={index}>
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              className="stroke-foreground/70"
              strokeWidth={1.5}
              strokeDasharray={edge.async ? "6 4" : undefined}
              markerEnd="url(#arrow)"
              markerStart={edge.both ? "url(#arrow)" : undefined}
            />
            {edge.label && (
              <text
                x={(start.x + end.x) / 2}
                y={(start.y + end.y) / 2}
                fontSize={11}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground/80 stroke-card"
                strokeWidth={5}
                paintOrder="stroke"
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      {spec.nodes.map((node) => {
        const rect = rects.get(node.id)!;
        const lines = node.label.split("\n");
        return (
          <g key={node.id}>
            <rect
              x={rect.cx - rect.hw}
              y={rect.cy - rect.hh}
              width={BOX_W}
              height={BOX_H}
              rx={6}
              className={node.external ? "fill-muted stroke-foreground/70" : "fill-card stroke-foreground/70"}
              strokeWidth={1.5}
              strokeDasharray={node.external ? "3 3" : undefined}
            />
            <text fontSize={12} textAnchor="middle" className="fill-foreground">
              {lines.map((line, index) => (
                <tspan
                  key={index}
                  x={rect.cx}
                  y={rect.cy + (index - (lines.length - 1) / 2) * 15 + 4}
                  fontWeight={index === 0 ? 600 : 400}
                >
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
