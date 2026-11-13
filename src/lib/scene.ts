// The subset of an Excalidraw element that the review uses.
export type SceneElement = {
  id: string;
  type: string;
  text?: string;
  containerId?: string | null;
  startBinding?: { elementId: string } | null;
  endBinding?: { elementId: string } | null;
  // Set on the decoration parts of a palette piece, for example the ends of a cylinder.
  // "boundary" is set on a frame from the palette, for example a region.
  customData?: { decor?: boolean; boundary?: boolean } | null;
  // Kept for arrows that are not solid. A dashed arrow is an asynchronous message.
  strokeStyle?: string;
  groupIds?: readonly string[];
};

// Describe the diagram as text, so the reviewer gets exact labels and connections.
export function describeScene(elements: SceneElement[]): string {
  const labels = new Map<string, string>();
  const freeText: string[] = [];
  for (const element of elements) {
    if (element.type !== "text" || !element.text) continue;
    if (element.containerId) labels.set(element.containerId, element.text);
    else freeText.push(element.text);
  }
  // An arrow can end on a decoration part of a piece. Then the label of the piece is the name.
  const groupLabels = new Map<string, string>();
  for (const element of elements) {
    const label = labels.get(element.id);
    if (label) for (const group of element.groupIds ?? []) groupLabels.set(group, label);
  }
  const byId = new Map(elements.map((element) => [element.id, element]));
  const labelOf = (id: string) => {
    const group = (byId.get(id)?.groupIds ?? []).find((item) => groupLabels.has(item));
    return labels.get(id) || (group && groupLabels.get(group)) || "(shape with no label)";
  };
  const name = (id?: string) => (id ? labelOf(id) : "(not attached)");

  const components: string[] = [];
  const connections: string[] = [];
  const boundaries: string[] = [];
  const styleNote: Record<string, string> = { dashed: " (dashed line)", dotted: " (dotted line)" };
  for (const element of elements) {
    if (element.customData?.decor) continue;
    if (element.type === "arrow" || element.type === "line") {
      const label = labels.get(element.id);
      connections.push(
        `- ${name(element.startBinding?.elementId)} -> ${name(element.endBinding?.elementId)}${label ? ` [${label}]` : ""}${styleNote[element.strokeStyle ?? ""] ?? ""}`,
      );
    } else if (element.customData?.boundary) {
      boundaries.push(`- ${labels.get(element.id) || "(no label)"}`);
    } else if (element.type !== "text") {
      components.push(`- ${element.type}: ${labels.get(element.id) || "(no label)"}`);
    }
  }

  const section = (title: string, lines: string[]) =>
    `${title}:\n${lines.length ? lines.join("\n") : "- none"}`;
  const hasStyles = connections.some((line) => line.endsWith("line)"));
  return [
    section("Components", components),
    section(
      hasStyles
        ? "Connections (in the palette of the app, a solid line is a synchronous call, a dashed line is an asynchronous message, and a dotted line is data replication)"
        : "Connections",
      connections,
    ),
    ...(boundaries.length
      ? [section("Boundaries (frames around components; this text does not say which components are in each frame, the picture does)", boundaries)]
      : []),
    section("Free text", freeText.map((text) => `- ${text}`)),
  ].join("\n\n");
}

// Keep only the fields of each canvas element that the text description uses.
export function slimElements(elements: readonly object[]): SceneElement[] {
  return (elements as SceneElement[]).map(({ id, type, text, containerId, startBinding, endBinding, customData, groupIds, strokeStyle }) => ({
    id,
    type,
    text,
    containerId,
    startBinding: startBinding ? { elementId: startBinding.elementId } : null,
    endBinding: endBinding ? { elementId: endBinding.elementId } : null,
    ...(customData?.decor ? { customData: { decor: true } } : {}),
    ...(customData?.boundary ? { customData: { boundary: true } } : {}),
    ...((type === "arrow" || type === "line") && strokeStyle && strokeStyle !== "solid" ? { strokeStyle } : {}),
    ...(groupIds?.length ? { groupIds } : {}),
  }));
}
