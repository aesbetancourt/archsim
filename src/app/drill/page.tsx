import { Repeat } from "lucide-react";
import Link from "next/link";
import VocabularyDrill from "@/components/VocabularyDrill";

export default function DrillPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-3">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <Repeat className="size-7 shrink-0 text-primary" aria-hidden />
          Vocabulary drill
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Practice the terms that interviewers ask about. For each term, explain it in your own
          words first, then compare with the answer. Say it out loud if you can: an interview tests
          whether you can explain a term under pressure, not whether you can recognize it.
        </p>
        <p className="text-muted-foreground">
          The terms come from the{" "}
          <Link href="/glossary" className="text-primary hover:underline">
            glossary
          </Link>
          . Known terms come back later and later. Missed terms come back first. Your progress is
          saved in this browser.
        </p>
        <p className="text-muted-foreground">
          To practice full answers, use the{" "}
          <Link href="/drill/questions" className="text-primary hover:underline">
            question drill
          </Link>
          .
        </p>
      </header>
      <VocabularyDrill />
    </main>
  );
}
