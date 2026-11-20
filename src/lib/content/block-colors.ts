/**
 * The watercolor wash that replaces each old pastel fill of the building blocks.
 * The washes are as in the ink-and-wash drawings of the Beaux-Arts. Before, the fills were the
 * bright pastels of Excalidraw. Each wash keeps the hue of the pastel that it replaces, so a group
 * keeps its meaning. Ink text has a contrast of at least 9.8:1 on each wash.
 */
export const PASTEL_TO_WASH: Record<string, string> = {
  "#a5d8ff": "#b7cde2", // Clients and entry: blue
  "#d0bfff": "#cdc2de", // Compute: lavender
  "#b2f2bb": "#c2d8ad", // Databases: sage green
  "#96f2d7": "#a9d2cf", // Other storage: celadon
  "#ffec99": "#ecd394", // Messaging: ochre
  "#ffc9c9": "#ebbcb0", // Security: rose
  "#ffd8a8": "#e8c39b", // Operations: sienna
  "#e9ecef": "#e4dccb", // Connections: paper grey
  "#dee2e6": "#ddd3bf", // Boundaries: darker paper grey
  "#fcc2d7": "#e6c5cf", // Patterns: muted rose
};

/** The background of the canvas: a light paper, not pure white. */
export const CANVAS_PAPER = "#fbf8f1";

/**
 * Change the old pastel fills of a drawing to the washes.
 * A saved drawing keeps the colors that it had when it was saved. Use this when the drawing opens,
 * so one drawing does not mix the two sets.
 * @param elements The elements of the saved drawing.
 * @returns The elements, with each old pastel fill changed to its wash. Other elements stay as
 * they are.
 * @example
 * recolorElements([{ backgroundColor: "#a5d8ff" }]); // [{ backgroundColor: "#b7cde2" }]
 */
export function recolorElements(elements: unknown[]): unknown[] {
  return elements.map((element) => {
    if (!element || typeof element !== "object") return element;
    const fill = (element as { backgroundColor?: unknown }).backgroundColor;
    if (typeof fill !== "string") return element;
    const wash = PASTEL_TO_WASH[fill.toLowerCase()];
    return wash ? { ...element, backgroundColor: wash } : element;
  });
}
