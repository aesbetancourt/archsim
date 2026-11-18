"use client";

import Link from "next/link";
import Drill, { type DrillFilter } from "@/components/Drill";
import { glossary, glossaryCategories, type GlossaryTerm } from "@/lib/glossary";

// The interview gaps are in application design, so the drill starts there.
const FIRST_CATEGORY = "Application design";

const filters: DrillFilter<GlossaryTerm>[] = [
  ...[FIRST_CATEGORY, ...glossaryCategories.filter((category) => category !== FIRST_CATEGORY)].map(
    (category) => ({ label: category, test: (term: GlossaryTerm) => term.category === category }),
  ),
  { label: "All", test: () => true },
];

// The vocabulary drill: explain each glossary term in your own words.
export default function VocabularyDrill() {
  return (
    <Drill
      items={glossary}
      filters={filters}
      storageKey="archsim:drill"
      // Few enough new terms to finish in about 15 minutes.
      newPerSession={10}
      noun={{ one: "term", many: "terms" }}
      gradeUrl="/api/drill/grade"
      gradeBody={(term, answer) => ({ termId: term.id, answer })}
      title={(term) => <h2 className="text-2xl font-semibold tracking-tight">{term.term}</h2>}
      meta={(term) => term.category}
      placeholder="Explain it in your own words, as you would to an interviewer. Then give an example from your own code."
      answerLabel={(term) => `Your explanation of ${term.term}`}
      reference={(term) => (
        <>
          <h3 className="font-medium">The reference</h3>
          <p>{term.definition}</p>
          <p className="text-muted-foreground">Example: {term.example}</p>
          {term.learn && (
            <Link
              href={`/learn/${term.learn}`}
              className="text-primary hover:underline"
              target="_blank"
            >
              Read the lesson
            </Link>
          )}
        </>
      )}
    />
  );
}
