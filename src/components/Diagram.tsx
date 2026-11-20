import BlockIcon from "@/components/BlockIcon";
import {
  diagramShapes,
  type DiagramShape,
  shapeOf,
  shapeStyle,
} from "@/lib/content/diagram-shapes";
import type { DiagramSpec } from "@/lib/content/examples";

/**
 * What a walkthrough step shows of a diagram. Without a view, the diagram shows all of it.
 */
export type DiagramView = {
  visible: Set<string>;
  // The positions of the visible arrows in spec.edges.
  edges: Set<number>;
  flows: { edge: number; reverse: boolean }[];
  focus: Set<string>;
  down: Set<string>;
  notes: Record<string, string>;
  // A new value starts the packet animations again.
  step: number;
};

const FADE = { transition: "opacity 400ms ease" };
const PACKET_SECONDS = 1.6;

const CELL_W = 270;
const CELL_H = 110;
const BOX_W = 170;
const BOX_H = 56;
const PERSON_H = 76;
const PAD = 40;
const GROUP_PAD = 18;
const GROUP_HEADER = 22;
// The label of a group, from the top left corner of its frame.
const GROUP_LABEL = { x: 12, y: 18 };

// The figure of a person, measured from the top of its node: the head, the neck, the arms, the
// hips, and the two legs.
const FIGURE = {
  headCenter: 7,
  headRadius: 6,
  armsAt: 12,
  armHalf: 10,
  hipsAt: 20,
  legX: 8,
  legY: 10,
};
// The first line of the name of a person, below the figure.
const PERSON_NAME_TOP = 52;
// The height of one line of text in a node, and the move from the middle to the text baseline.
const LINE_HEIGHT = 15;
const BASELINE = 4;
const BOX_CORNER = 6;
// The line in a device box, above its lower edge.
const DEVICE_LINE = 7;
// A note above a node: the width of one character, the space at the two ends, the height, the
// text baseline above the bottom, and the space to the node.
const NOTE = { charWidth: 6.4, padding: 16, height: 20, baseline: 6, gap: 10 };
const FONT_WEIGHT = { bold: 600, normal: 400 };
// An arrow that carries the flow of this step is wider.
const ARROW_WIDTH = { flow: 3, normal: 2 };
// The ring around a part in focus: the space between the ring and the part.
const FOCUS_GAP = 6;
// A part that failed is faint, and has a badge with a cross: the start of the cross from the
// corner, and its size.
const DOWN_OPACITY = 0.45;
const CROSS = { x: 7, y: 3, size: 10 };

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

// The move of the text of a node from the center. The text of a cylinder is below its top.
// The text of a pipe is left of its round end. The text of a device is above its stand.
const textOffset: Partial<Record<DiagramShape, { x: number; y: number }>> = {
  pipe: { x: -END / 2, y: 0 },
  store: { x: 0, y: END / 2 },
  device: { x: 0, y: -3 },
};
const NO_OFFSET = { x: 0, y: 0 };

// The corners of a form in the legend. The other forms have small round corners.
const legendCorners: Partial<Record<DiagramShape, string>> = { actor: "rounded-full", module: "" };

// An arrow that is not part of this step is hidden. An arrow to a part that failed is faint.
const BROKEN_OPACITY = 0.3;
function arrowOpacity(visible: boolean, broken: boolean): number {
  if (!visible) return 0;
  if (broken) return BROKEN_OPACITY;
  return 1;
}

// Draw one node in its form. The forms are the same as the pieces of the canvas palette.
function NodeShape({ shape, rect }: { shape: DiagramShape; rect: Rect }) {
  const left = rect.cx - rect.hw;
  const right = rect.cx + rect.hw;
  const top = rect.cy - rect.hh;
  const bottom = rect.cy + rect.hh;
  const paint = {
    fill: shapeStyle[shape].color,
    className: "stroke-foreground/70",
    strokeWidth: 2,
  };

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
  if (shape === "actor")
    return <ellipse cx={rect.cx} cy={rect.cy} rx={rect.hw} ry={rect.hh} {...paint} />;
  if (shape === "person") {
    // A figure of a person. The name is below it.
    const head = top + FIGURE.headCenter;
    return (
      <g className="stroke-foreground/70" strokeWidth={2} strokeLinecap="round">
        <circle cx={rect.cx} cy={head} r={FIGURE.headRadius} fill={shapeStyle.person.color} />
        <path
          d={`M ${rect.cx} ${head + FIGURE.headRadius} V ${head + FIGURE.hipsAt} M ${rect.cx - FIGURE.armHalf} ${head + FIGURE.armsAt} H ${rect.cx + FIGURE.armHalf} M ${rect.cx} ${head + FIGURE.hipsAt} l ${-FIGURE.legX} ${FIGURE.legY} M ${rect.cx} ${head + FIGURE.hipsAt} l ${FIGURE.legX} ${FIGURE.legY}`}
          fill="none"
        />
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
        rx={shape === "module" ? 0 : BOX_CORNER}
        strokeDasharray={shape === "external" ? "5 4" : undefined}
        {...paint}
      />
      {shape === "device" && (
        // A line in the box, like the lower edge of a screen.
        <line
          x1={left}
          y1={bottom - DEVICE_LINE}
          x2={right}
          y2={bottom - DEVICE_LINE}
          className="stroke-foreground/70"
          strokeWidth={2}
        />
      )}
    </>
  );
}

// A short note above a node, in a rounded label.
function Note({ x, y, text }: { x: number; y: number; text: string }) {
  const width = text.length * NOTE.charWidth + NOTE.padding;
  return (
    <g>
      <rect
        x={x - width / 2}
        y={y - NOTE.height}
        width={width}
        height={NOTE.height}
        rx={10}
        className="fill-card stroke-primary"
        strokeWidth={1.5}
      />
      <text
        x={x}
        y={y - NOTE.baseline}
        fontSize={11}
        fontWeight={600}
        textAnchor="middle"
        className="fill-foreground"
      >
        {text}
      </text>
    </g>
  );
}

/**
 * Draws a diagram from a grid description, with a legend of the forms it uses.
 * @returns The diagram as an SVG image, and its legend.
 */
export default function Diagram({ spec, view }: { spec: DiagramSpec; view?: DiagramView }) {
  const shown = (id: string) => !view || view.visible.has(id);
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
        className="block w-full rounded-base border bg-card"
        // An inline SVG needs role="img" to be one image for a screen reader.
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="img"
        aria-label="Architecture diagram"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" className="fill-foreground/70" />
          </marker>
        </defs>

        {groups.map((group) => (
          <g
            key={group.id}
            style={{ ...FADE, opacity: shown(group.id) ? 1 : 0 }}
            aria-hidden={!shown(group.id)}
          >
            <rect
              x={group.left}
              y={group.top}
              width={group.width}
              height={group.height}
              rx={10}
              className="fill-primary/5 stroke-primary"
              strokeWidth={2}
            />
            <text
              x={group.left + GROUP_LABEL.x}
              y={group.top + GROUP_LABEL.y}
              fontSize={12}
              fontWeight={600}
              className="fill-primary"
            >
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
          const visible = !view || view.edges.has(index);
          const flow = view?.flows.find((item) => item.edge === index);
          // An arrow to a part that failed carries nothing.
          const broken = view && (view.down.has(edge.from) || view.down.has(edge.to));
          const [a, b] = flow?.reverse ? [end, start] : [start, end];
          return (
            <g
              key={index}
              style={{ ...FADE, opacity: arrowOpacity(visible, Boolean(broken)) }}
              aria-hidden={!visible}
            >
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                className={flow ? "stroke-primary" : "stroke-foreground/70"}
                strokeWidth={flow ? ARROW_WIDTH.flow : ARROW_WIDTH.normal}
                strokeDasharray={edge.async ? "6 4" : undefined}
                markerEnd="url(#arrow)"
                markerStart={edge.both ? "url(#arrow)" : undefined}
              />
              {/* The label is after the packets, so the packets pass under it. */}
              {flow &&
                visible &&
                // Two packets on each active arrow. A user who asks for less motion sees only the
                // colored arrow.
                [0, PACKET_SECONDS / 2].map((delay) => (
                  <circle
                    key={`${view?.step}-${delay}`}
                    r={5}
                    className="fill-primary stroke-card motion-reduce:hidden"
                    strokeWidth={2}
                  >
                    <animateMotion
                      dur={`${PACKET_SECONDS}s`}
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                      path={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
                    />
                  </circle>
                ))}
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
          const { x: dx, y: dy } = textOffset[shape] ?? NO_OFFSET;
          // The name of a person starts below the figure.
          const lineY = (index: number) => {
            if (shape === "person")
              return rect.cy - rect.hh + PERSON_NAME_TOP + index * LINE_HEIGHT;
            return rect.cy + dy + (index - (lines.length - 1) / 2) * LINE_HEIGHT + BASELINE;
          };
          const down = view?.down.has(node.id);
          const note = view?.notes[node.id];
          return (
            <g
              key={node.id}
              style={{ ...FADE, opacity: shown(node.id) ? 1 : 0 }}
              aria-hidden={!shown(node.id)}
            >
              {view?.focus.has(node.id) && (
                <rect
                  x={rect.cx - rect.hw - FOCUS_GAP}
                  y={rect.cy - rect.hh - FOCUS_GAP}
                  width={(rect.hw + FOCUS_GAP) * 2}
                  height={(rect.hh + FOCUS_GAP) * 2}
                  rx={10}
                  fill="none"
                  className="stroke-primary"
                  strokeWidth={3}
                />
              )}
              <g opacity={down ? DOWN_OPACITY : 1}>
                <NodeShape shape={shape} rect={rect} />
                <text
                  fontSize={12}
                  textAnchor="middle"
                  fill={shape === "person" ? undefined : "#000"}
                  className={shape === "person" ? "fill-foreground" : undefined}
                >
                  {lines.map((line, index) => (
                    <tspan
                      key={index}
                      x={rect.cx + dx}
                      y={lineY(index)}
                      fontWeight={index === 0 ? FONT_WEIGHT.bold : FONT_WEIGHT.normal}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
              {down && (
                // A red badge with a cross on the corner of a part that failed. The name stays
                // readable.
                <g>
                  <circle
                    cx={rect.cx + rect.hw - 2}
                    cy={rect.cy - rect.hh + 2}
                    r={11}
                    fill="#e03131"
                    className="stroke-card"
                    strokeWidth={2}
                  />
                  <path
                    d={`M ${rect.cx + rect.hw - CROSS.x} ${rect.cy - rect.hh - CROSS.y} l ${CROSS.size} ${CROSS.size} m 0 ${-CROSS.size} l ${-CROSS.size} ${CROSS.size}`}
                    stroke="#fff"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                </g>
              )}
              {note && <Note x={rect.cx} y={rect.cy - rect.hh - NOTE.gap} text={note} />}
            </g>
          );
        })}
      </svg>
      {/* The read-aloud player skips the legend. */}
      <figcaption
        data-read-skip
        className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
      >
        {used.map((shape) => (
          <span key={shape} className="flex items-center gap-1.5">
            <span
              style={{ backgroundColor: shapeStyle[shape].color }}
              className={`flex h-4 w-5 items-center justify-center border border-foreground/70 text-black ${
                legendCorners[shape] ?? "rounded-sm"
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
