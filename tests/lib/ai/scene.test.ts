import { describe, expect, it } from "vitest";
import { describeScene, slimElements, type SceneElement } from "@/lib/ai/scene";

// A shape with its label, as Excalidraw saves them: the text element points to its container.
const box = (id: string, label: string, extra: Partial<SceneElement> = {}): SceneElement[] => [
  { id, type: "rectangle", ...extra },
  { id: `${id}-text`, type: "text", text: label, containerId: id },
];
const arrow = (id: string, from?: string, to?: string, extra: Partial<SceneElement> = {}) => ({
  id,
  type: "arrow",
  startBinding: from ? { elementId: from } : null,
  endBinding: to ? { elementId: to } : null,
  ...extra,
});

describe("describeScene", () => {
  it("says that an empty diagram has nothing", () => {
    expect(describeScene([])).toBe(
      "Components:\n- none\n\nConnections:\n- none\n\nFree text:\n- none",
    );
  });

  it("lists each component with its label, and each connection with its two ends", () => {
    const text = describeScene([
      ...box("api", "Orders API"),
      ...box("db", "Orders DB"),
      arrow("a1", "api", "db"),
      { id: "a1-text", type: "text", text: "reads", containerId: "a1" },
    ]);
    expect(text).toContain("Components:\n- rectangle: Orders API\n- rectangle: Orders DB");
    expect(text).toContain("Connections:\n- Orders API -> Orders DB [reads]");
  });

  it("marks a dashed arrow, and then explains the line styles of the palette", () => {
    const text = describeScene([
      ...box("api", "API"),
      ...box("queue", "Queue"),
      arrow("a1", "api", "queue", { strokeStyle: "dashed" }),
    ]);
    expect(text).toContain("- API -> Queue (dashed line)");
    expect(text).toContain("a dashed line is an asynchronous message");
  });

  it("does not explain the line styles when all arrows are solid", () => {
    const text = describeScene([...box("a", "A"), ...box("b", "B"), arrow("a1", "a", "b")]);
    expect(text).toContain("Connections:\n- A -> B");
    expect(text).not.toContain("palette of the app");
  });

  it("names an arrow that ends on a decoration part by the label of the piece", () => {
    // A database from the palette is a group: a body with the label, and a decoration for its top.
    const text = describeScene([
      ...box("api", "API"),
      ...box("body", "Orders DB", { groupIds: ["g1"] }),
      { id: "top", type: "ellipse", groupIds: ["g1"], customData: { decor: true } },
      arrow("a1", "api", "top"),
    ]);
    expect(text).toContain("- API -> Orders DB");
    // The decoration is not a component of its own.
    expect(text).not.toContain("ellipse");
  });

  it("says when an end of an arrow is not attached, or a shape has no label", () => {
    const text = describeScene([{ id: "bare", type: "rectangle" }, arrow("a1", "bare", undefined)]);
    expect(text).toContain("- rectangle: (no label)");
    expect(text).toContain("- (shape with no label) -> (not attached)");
  });

  it("lists a frame from the palette as a boundary, not as a component", () => {
    const text = describeScene([...box("region", "EU region", { customData: { boundary: true } })]);
    expect(text).toContain("Boundaries (frames around components");
    expect(text).toContain("- EU region");
    expect(text).toContain("Components:\n- none");
  });

  it("lists a text that is not inside a shape as free text", () => {
    const text = describeScene([{ id: "t", type: "text", text: "p99 under 200 ms" }]);
    expect(text).toContain("Free text:\n- p99 under 200 ms");
  });
});

describe("slimElements", () => {
  it("keeps only the fields that the description uses", () => {
    const [slim] = slimElements([
      {
        id: "a",
        type: "rectangle",
        x: 10,
        y: 20,
        strokeColor: "#000",
        link: "https://example.com",
      },
    ]);
    expect(Object.keys(slim).sort()).toEqual(
      ["containerId", "endBinding", "id", "startBinding", "text", "type"].sort(),
    );
  });

  it("keeps the line style of an arrow that is not solid, and only of an arrow", () => {
    const [dashed, solid, shape] = slimElements([
      { id: "a", type: "arrow", strokeStyle: "dashed" },
      { id: "b", type: "arrow", strokeStyle: "solid" },
      { id: "c", type: "rectangle", strokeStyle: "dashed" },
    ]);
    expect(dashed.strokeStyle).toBe("dashed");
    expect(solid.strokeStyle).toBeUndefined();
    expect(shape.strokeStyle).toBeUndefined();
  });

  it("gives the same description as the full elements", () => {
    const full = [
      { id: "api", type: "rectangle", x: 1, groupIds: ["g"] },
      { id: "t", type: "text", text: "API", containerId: "api", fontSize: 20 },
      { id: "d", type: "ellipse", groupIds: ["g"], customData: { decor: true, other: 1 } },
      { id: "f", type: "rectangle", customData: { boundary: true } },
      {
        id: "a",
        type: "arrow",
        startBinding: { elementId: "api", gap: 4 },
        endBinding: null,
        strokeStyle: "dotted",
      },
    ];
    expect(describeScene(slimElements(full))).toBe(describeScene(full as SceneElement[]));
  });
});
