// The subset of an Excalidraw element that the review uses.
export type SceneElement = {
  id: string;
  type: string;
  text?: string;
  containerId?: string | null;
  startBinding?: { elementId: string } | null;
  endBinding?: { elementId: string } | null;
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
  const name = (id?: string) => (id ? labels.get(id) || "(shape with no label)" : "(not attached)");

  const components: string[] = [];
  const connections: string[] = [];
  for (const element of elements) {
    if (element.type === "arrow" || element.type === "line") {
      const label = labels.get(element.id);
      connections.push(
        `- ${name(element.startBinding?.elementId)} -> ${name(element.endBinding?.elementId)}${label ? ` [${label}]` : ""}`,
      );
    } else if (element.type !== "text") {
      components.push(`- ${element.type}: ${labels.get(element.id) || "(no label)"}`);
    }
  }

  const section = (title: string, lines: string[]) =>
    `${title}:\n${lines.length ? lines.join("\n") : "- none"}`;
  return [
    section("Components", components),
    section("Connections", connections),
    section("Free text", freeText.map((text) => `- ${text}`)),
  ].join("\n\n");
}
