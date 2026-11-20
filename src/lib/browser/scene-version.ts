import { sumBy } from "es-toolkit";

/**
 * Get a number that changes when the drawing changes. Excalidraw adds one to the version of
 * an element at each change, and the count changes when an element is added or removed.
 * @param elements The elements of the drawing.
 * @returns The sum of the element versions, plus the number of elements.
 * @example
 * const version = sceneVersion(elements);
 */
export function sceneVersion(elements: readonly { version: number }[]): number {
  return sumBy(elements, (element) => element.version) + elements.length;
}
