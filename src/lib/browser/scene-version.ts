import { sumBy } from "es-toolkit";

// A number that changes when the drawing changes. Excalidraw adds one to the version of an element
// at each change, and the count changes when an element is added or removed.
export function sceneVersion(elements: readonly { version: number }[]): number {
  return sumBy(elements, (element) => element.version) + elements.length;
}
