"use client";

import Link from "next/link";
import Drill, { type DrillFilter } from "@/components/Drill";
import Prose from "@/components/Prose";
import StoryPicker from "@/components/StoryPicker";
import type { Question } from "@/lib/content/questions";
import { useProgress } from "@/lib/browser/use-progress";

// The question drill: answer the interview questions of the lessons, as in an interview.
export default function QuestionDrill({
  questions,
  sections,
}: {
  questions: Question[];
  sections: string[];
}) {
  const done = useProgress();
  const filters: DrillFilter<Question>[] = [
    ...sections.map((section) => ({
      label: section,
      test: (question: Question) => question.section === section,
    })),
    {
      label: "Behavioral",
      test: (question: Question) => question.slug === "behavioral-interviews",
    },
    {
      label: "Finished lessons",
      test: (question: Question) => Boolean(done[question.slug]),
      empty:
        "No lesson is marked as done yet. Mark a lesson as done at its end, and its questions come here.",
    },
    { label: "All", test: () => true },
  ];

  return (
    <Drill
      items={questions}
      filters={filters}
      storageKey="charrette:question-drill"
      // An answer takes a few minutes, so a session has fewer new questions than the vocabulary.
      newPerSession={5}
      noun={{ one: "question", many: "questions" }}
      gradeUrl="/api/drill/question"
      gradeBody={(question, answer) => ({ questionId: question.id, answer })}
      title={(question) => (
        <h2 className="text-xl font-semibold tracking-tight">{question.question}</h2>
      )}
      meta={(question) => question.lesson}
      placeholder="Answer as you would in the interview: your position, the reason, and the trade-off. Then one example."
      answerLabel={(question) => `Your answer to: ${question.question}`}
      rows={7}
      answerTools={(question, setAnswer) =>
        question.slug === "behavioral-interviews" ? <StoryPicker onPick={setAnswer} /> : null
      }
      reference={(question) => (
        <>
          <h3 className="font-medium">The points of a strong answer</h3>
          <Prose compact markdown={question.points.map((point) => `- ${point}`).join("\n")} />
          <Link href={question.href} className="text-primary hover:underline" target="_blank">
            Read the lesson: {question.lesson}
          </Link>
        </>
      )}
    />
  );
}
