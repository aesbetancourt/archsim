// The form of each node in a drawn diagram. The forms are the same as in the palette of the canvas.
export type DiagramShape = "box" | "person" | "actor" | "device" | "module" | "store" | "pipe" | "external";

export const diagramShapes: DiagramShape[] = ["person", "actor", "device", "external", "box", "module", "store", "pipe"];

// The fill color and the legend text of each form. The colors are the colors of the palette groups.
export const shapeStyle: Record<DiagramShape, { color: string; legend: string }> = {
  person: { color: "#a5d8ff", legend: "User" },
  actor: { color: "#a5d8ff", legend: "Client" },
  device: { color: "#a5d8ff", legend: "Device" },
  external: { color: "#a5d8ff", legend: "External system" },
  box: { color: "#d0bfff", legend: "Service or other running part" },
  module: { color: "#d0bfff", legend: "Module in one deployment" },
  store: { color: "#b2f2bb", legend: "Stored data" },
  pipe: { color: "#ffec99", legend: "Queue, topic, or stream" },
};

const PERSON = /^(user|users|viewer|creator|customer|buyer|bidder|driver|operator|admin|head office admin|promoter admin)$/;
const ACTOR = /\b(browser|app|phone|web app|ui|user interface|client)\b/;
const DEVICE = /\b(scanner|scanners|screen|sensor|sensors|kiosk|device|devices|terminal)\b/;
const MODULE = /\(module\)|\bplug-in\b/;
const PIPE = /\b(queue|queues|stream|broker|topic|bus)\b/;
const STORE = /\b(database|store|storage|cache|ledger|index|warehouse|registry|db)\b/;

// Find the form of a node. A node can state its form. If it does not, the name decides.
// Only the name counts, not the text in parentheses or on the second line.
export function shapeOf(node: { label: string; external?: boolean; shape?: DiagramShape }): DiagramShape {
  if (node.shape) return node.shape;
  if (node.external) return "external";
  const label = node.label.toLowerCase().replace(/\n/g, " ");
  if (MODULE.test(label)) return "module";
  const name = label.split("(")[0].trim();
  if (PERSON.test(name)) return "person";
  if (DEVICE.test(name)) return "device";
  if (ACTOR.test(name)) return "actor";
  if (PIPE.test(name)) return "pipe";
  if (STORE.test(name)) return "store";
  return "box";
}
