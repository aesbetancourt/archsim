"use client";

import Link from "next/link";
import Drill, { type DrillFilter } from "@/components/Drill";
import Prose from "@/components/Prose";
import type { Question } from "@/lib/content/questions";

// The product drill: cost estimates, proof of value, business models, priorities, and timing.
export default function ProductDrill({
  cases,
  sections,
}: {
  cases: Question[];
  sections: string[];
}) {
  const filters: DrillFilter<Question>[] = [
    ...sections.map((section) => ({
      label: section,
      test: (item: Question) => item.section === section,
    })),
    { label: "All", test: () => true },
  ];

  return (
    <Drill
      items={cases}
      filters={filters}
      storageKey="charrette:product-drill"
      // A case with arithmetic takes a few minutes, so a session has few new cases.
      newPerSession={5}
      noun={{ one: "case", many: "cases" }}
      gradeUrl="/api/drill/product"
      gradeBody={(item, answer) => ({ questionId: item.id, answer })}
      title={(item) => <h2 className="text-xl font-semibold tracking-tight">{item.question}</h2>}
      meta={(item) => item.section}
      placeholder="Start with your number or your position. Then your assumptions, the arithmetic, and what would change your answer."
      answerLabel={(item) => `Your answer to: ${item.question}`}
      rows={8}
      reference={(item) => (
        <>
          <h3 className="font-medium">The points of a strong answer</h3>
          <Prose compact markdown={item.points.map((point) => `- ${point}`).join("\n")} />
          <Link href={item.href} className="text-primary hover:underline" target="_blank">
            Read the lesson: {item.lesson}
          </Link>
        </>
      )}
    />
  );
}
