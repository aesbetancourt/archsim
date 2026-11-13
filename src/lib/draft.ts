// The work in progress on a kata. It is saved in the browser, for each kata, until the user clears it.
export type Draft = {
  scope: string;
  selected: { name: string; why: string }[];
  style: string;
  rationale: string;
  scene: { elements: unknown[]; files: Record<string, unknown> };
  // The time of the last save.
  savedAt?: string;
};

const PREFIX = "archsim:draft:";
const draftKey = (kataId: string) => `${PREFIX}${kataId}`;

export function loadDraft(kataId: string): Draft | null {
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey(kataId)) ?? "null");
    if (!saved || typeof saved !== "object") return null;
    return {
      scope: String(saved.scope ?? ""),
      selected: Array.isArray(saved.selected) ? saved.selected : [],
      style: String(saved.style ?? ""),
      rationale: String(saved.rationale ?? ""),
      scene: { elements: saved.scene?.elements ?? [], files: saved.scene?.files ?? {} },
      savedAt: typeof saved.savedAt === "string" ? saved.savedAt : undefined,
    };
  } catch {
    // Storage is not available, or the saved text is damaged. Start with no draft.
    return null;
  }
}

// Save the draft. Return false if the browser refuses.
export function saveDraft(kataId: string, work: Draft): boolean {
  const draft = { ...work, savedAt: new Date().toISOString() };
  try {
    localStorage.setItem(draftKey(kataId), JSON.stringify(draft));
    return true;
  } catch {
    // Images in the drawing can be too large for the storage. Save the draft without them.
    try {
      localStorage.setItem(draftKey(kataId), JSON.stringify({ ...draft, scene: { ...draft.scene, files: {} } }));
      return true;
    } catch {
      return false;
    }
  }
}

export function clearDraft(kataId: string): void {
  try {
    localStorage.removeItem(draftKey(kataId));
  } catch {
    // Storage is not available. There is nothing to remove.
  }
}

export type DraftSummary = { kataId: string; savedAt?: string; stepsDone: number; shapes: number; hasNotes: boolean };

// List the katas that have unfinished work in this browser, newest first.
export function listDrafts(): DraftSummary[] {
  const summaries: DraftSummary[] = [];
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key?.startsWith(PREFIX)) continue;
      const kataId = key.slice(PREFIX.length);
      const draft = loadDraft(kataId);
      if (!draft) continue;
      const hasNotes = Boolean(localStorage.getItem(`archsim:notes:${kataId}`)?.replace(/<[^>]+>/g, "").trim());
      const steps = [draft.scope.trim(), draft.selected.length, draft.style, draft.scene.elements.length, draft.rationale.trim()];
      const stepsDone = steps.filter(Boolean).length;
      // A draft with no content is not unfinished work.
      if (stepsDone === 0 && !hasNotes) continue;
      // Count each piece one time. Do not count labels and the decoration parts of a piece.
      const shapes = (draft.scene.elements as { type?: string; customData?: { decor?: boolean } }[]).filter(
        (element) => element.type !== "text" && !element.customData?.decor,
      ).length;
      summaries.push({ kataId, savedAt: draft.savedAt, stepsDone, shapes, hasNotes });
    }
  } catch {
    // Storage is not available. There is no saved work to show.
  }
  return summaries.sort((a, b) => (b.savedAt ?? "").localeCompare(a.savedAt ?? ""));
}
