import { describe, expect, it } from "vitest";
import { PASTEL_TO_WASH, recolorElements } from "./block-colors";
import { blockGroups } from "./blocks";
import { shapeStyle } from "./diagram-shapes";

describe("recolorElements", () => {
  it("changes an old pastel fill to its wash, in any letter case", () => {
    const [element] = recolorElements([{ id: "a", backgroundColor: "#A5D8FF", x: 1 }]);
    expect(element).toEqual({ id: "a", backgroundColor: "#b7cde2", x: 1 });
  });

  it("keeps other fills and elements as they are", () => {
    const elements = [{ id: "a", backgroundColor: "transparent" }, { id: "b" }, null];
    expect(recolorElements(elements)).toEqual(elements);
  });
});

describe("the block colors", () => {
  const washes = new Set(Object.values(PASTEL_TO_WASH));

  it("uses only washes for the palette groups and the lesson diagrams", () => {
    expect(blockGroups.filter((group) => !washes.has(group.color))).toEqual([]);
    expect(Object.values(shapeStyle).filter((style) => !washes.has(style.color))).toEqual([]);
  });
});
