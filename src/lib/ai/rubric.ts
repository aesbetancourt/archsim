import { wikiSections } from "@/lib/content/wiki-pages";

export const dimensions = [
  { id: "scope", label: "Scope and core functions" },
  { id: "characteristics", label: "Characteristics identified" },
  { id: "style_fit", label: "Style fit" },
  { id: "boundaries", label: "Component boundaries" },
  { id: "data_communication", label: "Data and communication" },
  { id: "tradeoffs", label: "Trade-off justification" },
  { id: "risks", label: "Risks" },
] as const;

type DimensionId = (typeof dimensions)[number]["id"];

export type Review = {
  summary: string;
  dimensions: {
    id: DimensionId;
    score: number;
    evidence: string;
    improvement: string;
    // The three fields below teach. Reviews from before 2026-11-14 do not have them.
    // The idea behind the gap, in plain words.
    concept?: string;
    // The improvement, applied to this design.
    example?: string;
    // The slug of the Learn page to read, or "none".
    study?: string;
  }[];
  strengths: string[];
  top_risk: string;
  defense_questions: string[];
};

// The Learn pages that a review can send the person to.
export const studyPages = wikiSections
  .flatMap((section) => section.pages)
  .map((page) => ({ slug: page.slug, title: page.title }));

// The output of the reviewer must match this schema, with each provider.
export const reviewSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "dimensions", "strengths", "top_risk", "defense_questions"],
  properties: {
    summary: { type: "string" },
    dimensions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "score", "evidence", "concept", "improvement", "example", "study"],
        properties: {
          id: { type: "string", enum: dimensions.map((dimension) => dimension.id) },
          // An enum works with each provider. Some reject "minimum" and "maximum".
          score: { type: "integer", enum: [1, 2, 3, 4, 5] },
          evidence: { type: "string" },
          concept: { type: "string" },
          improvement: { type: "string" },
          example: { type: "string" },
          study: { type: "string", enum: [...studyPages.map((page) => page.slug), "none"] },
        },
      },
    },
    strengths: { type: "array", items: { type: "string" } },
    top_risk: { type: "string" },
    defense_questions: { type: "array", items: { type: "string" } },
  },
};
