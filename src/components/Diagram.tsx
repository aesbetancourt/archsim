import BlockIcon from "@/components/BlockIcon";
import { diagramShapes, type DiagramShape, shapeOf, shapeStyle } from "@/lib/diagram-shapes";
import type { DiagramSpec } from "@/lib/examples";

const CELL_W = 270;
const CELL_H = 110;
const BOX_W = 170;
const BOX_H = 56;
const PERSON_H = 76;
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

// The height of the round end of a cylinder, and the width of the round end of a pipe.
const END = 8;

// Draw one node in its form. The forms are the same as the pieces of the canvas palette.
function NodeShape({ shape, rect }: { shape: DiagramShape; rect: Rect }) {
  const left = rect.cx - rect.hw;
  const right = rect.cx + rect.hw;
  const top = rect.cy - rect.hh;
  const bottom = rect.cy + rect.hh;
  const paint = { fill: shapeStyle[shape].color, className: "stroke-foreground/70", strokeWidth: 2 };

  if (shape === "store") {
    // A cylinder: the body with a round bottom, and an ellipse on top.
    return (
      <>
        <path
          d={`M ${left} ${top + END} L ${left} ${bottom - END} A ${rect.hw} ${END} 0 0 0 ${right} ${bottom - END} L ${right} ${top + END} Z`}
          {...paint}
        />
        <ellipse cx={rect.cx} cy={top + END} rx={rect.hw} ry={END} {...paint} />
      </>
    );
  }
  if (shape === "pipe") {
    // A pipe: the same cylinder on its side.
    return (
      <>
        <path
          d={`M ${right - END} ${top} L ${left + END} ${top} A ${END} ${rect.hh} 0 0 0 ${left + END} ${bottom} L ${right - END} ${bottom} Z`}
          {...paint}
        />
        <ellipse cx={right - END} cy={rect.cy} rx={END} ry={rect.hh} {...paint} />
      </>
    );
  }
  if (shape === "actor") return <ellipse cx={rect.cx} cy={rect.cy} rx={rect.hw} ry={rect.hh} {...paint} />;
  if (shape === "person") {
    // A figure of a person. The name is below it.
    const head = top + 7;
    return (
      <g className="stroke-foreground/70" strokeWidth={2} strokeLinecap="round">
        <circle cx={rect.cx} cy={head} r={6} fill={shapeStyle.person.color} />
        <path d={`M ${rect.cx} ${head + 6} V ${head + 20} M ${rect.cx - 10} ${head + 12} H ${rect.cx + 10} M ${rect.cx} ${head + 20} l -8 10 M ${rect.cx} ${head + 20} l 8 10`} fill="none" />
      </g>
    );
  }
  return (
    <>
      <rect
        x={left}
        y={top}
        width={rect.hw * 2}
        height={rect.hh * 2}
        rx={shape === "module" ? 0 : 6}
        strokeDasharray={shape === "external" ? "5 4" : undefined}
        {...paint}
      />
      {shape === "device" && (
        // A line in the box, like the lower edge of a screen.
        <line x1={left} y1={bottom - 7} x2={right} y2={bottom - 7} className="stroke-foreground/70" strokeWidth={2} />
      )}
    </>
  );
}

// Draw a diagram from a grid description, with a legend of the forms it uses.
export default function Diagram({ spec }: { spec: DiagramSpec }) {
  const rects = new Map<string, Rect>();
  for (const node of spec.nodes) {
    // A person is taller than a box, because the name is below the figure.
    const hh = shapeOf(node) === "person" ? PERSON_H / 2 : BOX_H / 2;
    rects.set(node.id, { ...cellCenter(node.col, node.row), hw: BOX_W / 2, hh });
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

  const used = diagramShapes.filter((shape) => spec.nodes.some((node) => shapeOf(node) === shape));
  const hasAsync = spec.edges.some((edge) => edge.async);

  return (
    <figure className="mx-auto w-full space-y-2" style={{ maxWidth: width }}>
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block w-full rounded-base border-2 bg-card"
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
            strokeWidth={2}
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
              strokeWidth={2}
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
        const shape = shapeOf(node);
        const lines = node.label.split("\n");
        // The text of a cylinder is below its top. The text of a pipe is left of its round end.
        const dx = shape === "pipe" ? -END / 2 : 0;
        const dy = shape === "store" ? END / 2 : shape === "device" ? -3 : 0;
        // The name of a person starts below the figure.
        const lineY = (index: number) =>
          shape === "person"
            ? rect.cy - rect.hh + 52 + index * 15
            : rect.cy + dy + (index - (lines.length - 1) / 2) * 15 + 4;
        return (
          <g key={node.id}>
            <NodeShape shape={shape} rect={rect} />
            <text fontSize={12} textAnchor="middle" fill={shape === "person" ? undefined : "#000"} className={shape === "person" ? "fill-foreground" : undefined}>
              {lines.map((line, index) => (
                <tspan
                  key={index}
                  x={rect.cx + dx}
                  y={lineY(index)}
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
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {used.map((shape) => (
          <span key={shape} className="flex items-center gap-1.5">
            <span
              style={{ backgroundColor: shapeStyle[shape].color }}
              className={`flex h-4 w-5 items-center justify-center border border-foreground/70 text-black ${
                shape === "actor" ? "rounded-full" : shape === "module" ? "" : "rounded-sm"
              } ${shape === "external" ? "border-dashed" : ""}`}
            >
              <BlockIcon shape={shape} />
            </span>
            {shapeStyle[shape].legend}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <BlockIcon shape="call" /> Call that waits
        </span>
        {hasAsync && (
          <span className="flex items-center gap-1.5">
            <BlockIcon shape="message" /> Message, no wait
          </span>
        )}
      </figcaption>
    </figure>
  );
}
