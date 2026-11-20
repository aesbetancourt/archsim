import { MessageCircleQuestion } from "lucide-react";
import Link from "next/link";
import QuestionDrill from "@/components/QuestionDrill";
import { readQuestions } from "@/lib/content/questions";
import { wikiSections } from "@/lib/content/wiki-pages";

// Read the questions on each request, so a new question in a lesson shows at once.
export const dynamic = "force-dynamic";

export default async function QuestionDrillPage() {
  const questions = await readQuestions();
  const sections = wikiSections
    .map((section) => section.title)
    .filter((title) => questions.some((question) => question.section === title));

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-3">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <MessageCircleQuestion className="size-7 shrink-0 text-primary" aria-hidden />
          Question drill
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Practice the {questions.length} interview questions of the lessons. Answer each one as you
          would in the room: your position, the reason, and the trade-off. Say it out loud first if
          you can. Then write it, and compare with the points of a strong answer.
        </p>
        <p className="text-muted-foreground">
          Known questions come back later and later. Missed questions come back first. Select{" "}
          <span className="font-medium">Finished lessons</span> to practice what you already read.
          Your progress is saved in this browser. For single terms, use the{" "}
          <Link href="/drill" className="text-primary hover:underline">
            vocabulary drill
          </Link>
          .
        </p>
      </header>
      <QuestionDrill questions={questions} sections={sections} />
    </main>
  );
}
