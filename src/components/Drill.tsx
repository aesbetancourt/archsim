"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  boxCounts,
  dueTerms,
  loadProgress,
  review,
  saveProgress,
  type DrillProgress,
} from "@/lib/drill";
import { suggestKnew, type Grade } from "@/lib/drill-grade";

// A drill with the Leitner system and an optional AI check. The vocabulary drill and the
// question drill use it. Each drill gives its items, its filters, and how to show an item.

const VERDICT_LABEL: Record<Grade["verdict"], string> = {
  correct: "Correct",
  partly: "Partly correct",
  wrong: "Not correct",
};

export type DrillFilter<T> = { label: string; test: (item: T) => boolean; empty?: string };

type Props<T extends { id: string }> = {
  items: T[];
  // The filter buttons. The drill starts with the one at `initial`.
  filters: DrillFilter<T>[];
  initial?: number;
  storageKey: string;
  newPerSession: number;
  noun: { one: string; many: string };
  gradeUrl: string;
  gradeBody: (item: T, answer: string) => object;
  title: (item: T) => React.ReactNode;
  meta: (item: T) => string;
  placeholder: string;
  answerLabel: (item: T) => string;
  rows?: number;
  reference: (item: T) => React.ReactNode;
  // Optional tools above the answer box, for example to start from a saved story.
  answerTools?: (item: T, setAnswer: (text: string) => void) => React.ReactNode;
};

type Session<T> = { queue: T[]; knew: number; missed: number };
// An AI check belongs to one item. The person can move on before it returns.
type Check = { itemId: string; grade: Grade; model: string };

function errorText(caught: unknown): string {
  if (caught instanceof Error && caught.message) return caught.message;
  return "The check did not finish.";
}

export default function Drill<T extends { id: string }>({
  items,
  filters,
  initial = 0,
  storageKey,
  newPerSession,
  noun,
  gradeUrl,
  gradeBody,
  title,
  meta,
  placeholder,
  answerLabel,
  rows = 4,
  reference,
  answerTools,
}: Props<T>) {
  const [progress, setProgress] = useState<DrillProgress>({});
  const [filterIndex, setFilterIndex] = useState(initial);
  const [session, setSession] = useState<Session<T> | null>(null);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [check, setCheck] = useState<Check | null>(null);
  const [checkingId, setCheckingId] = useState("");
  const [checkError, setCheckError] = useState("");

  const startSession = (index: number, saved: DrillProgress): Session<T> => ({
    queue: dueTerms(items.filter(filters[index].test), saved, new Date(), newPerSession),
    knew: 0,
    missed: 0,
  });

  // localStorage exists only in the browser, so the saved progress loads after the first render.
  useEffect(() => {
    const saved = loadProgress(storageKey);
    // oxlint-disable-next-line react/set-state-in-effect
    setProgress(saved);
    setSession(startSession(initial, saved));
    // The drill starts one time, when the page opens. A filter button starts a new session.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const current = session?.queue[0];
  const currentCheck = check && check.itemId === current?.id ? check : null;
  const checking = checkingId !== "" && checkingId === current?.id;

  function resetCard() {
    setAnswer("");
    setRevealed(false);
    setCheckError("");
  }

  function selectFilter(index: number) {
    setFilterIndex(index);
    setSession(startSession(index, progress));
    resetCard();
  }

  async function checkWithAi() {
    if (!current) return;
    const itemId = current.id;
    setCheckingId(itemId);
    setCheckError("");
    try {
      const response = await fetch(gradeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gradeBody(current, answer)),
      });
      // A server crash can answer with an empty body or an HTML page, not JSON.
      const body = await response.json().catch(() => null);
      if (!response.ok || !body) {
        throw new Error(
          body?.error || `The server could not check the answer (HTTP ${response.status}).`,
        );
      }
      setCheck({ itemId, grade: body.grade, model: body.model });
      setRevealed(true);
    } catch (caught) {
      setCheckError(errorText(caught));
    }
    setCheckingId("");
  }

  function rate(knew: boolean) {
    if (!session) return;
    const [item, ...rest] = session.queue;
    const next = { ...progress, [item.id]: review(progress[item.id], knew, new Date()) };
    setProgress(next);
    saveProgress(next, storageKey);
    // A missed item comes back once at the end of this session.
    const alreadyRepeated = rest.some((entry) => entry.id === item.id);
    const queue = knew || alreadyRepeated ? rest : [...rest, item];
    setSession({
      queue,
      knew: session.knew + (knew ? 1 : 0),
      missed: session.missed + (knew ? 0 : 1),
    });
    resetCard();
  }

  // Count only the items of this drill. Old progress for an item that no longer exists is kept,
  // but it does not count.
  const known = new Set(items.map((item) => item.id));
  const counts = boxCounts(
    Object.fromEntries(Object.entries(progress).filter(([id]) => known.has(id))),
  );
  // Without an AI check, "I knew it" is the main button. With one, the suggested rating is.
  const suggestsKnew = currentCheck ? suggestKnew(currentCheck.grade) : true;
  const filter = filters[filterIndex];
  const inFilter = items.filter(filter.test).length;

  return (
    <div className="space-y-6">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Filter</legend>
        {filters.map((option, index) => (
          <Button
            key={option.label}
            size="sm"
            variant={index === filterIndex ? "default" : "ghost"}
            aria-pressed={index === filterIndex}
            onClick={() => selectFilter(index)}
          >
            {option.label}
          </Button>
        ))}
      </fieldset>

      <p className="text-xs text-muted-foreground">
        {items.length} {noun.many}. Boxes 1 to 5: {counts.join(" · ")}. A {noun.one} in box 5 comes
        back after two weeks.
      </p>

      {session && !current && (
        <Card>
          <CardContent className="space-y-3">
            {inFilter === 0 && filter.empty ? (
              <p>{filter.empty}</p>
            ) : (
              <>
                <h2 className="text-lg font-semibold">Session done</h2>
                <p>
                  You knew {session.knew} and missed {session.missed}. The missed {noun.many} come
                  back first next time.
                </p>
                <p className="text-muted-foreground">
                  No more {noun.many} are due here today. Select another filter, or come back
                  tomorrow.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {current && (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              {title(current)}
              <span className="shrink-0 text-xs text-muted-foreground">
                {session.queue.length} left · {meta(current)}
              </span>
            </div>
            {answerTools?.(current, setAnswer)}
            <Textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder={placeholder}
              aria-label={answerLabel(current)}
              rows={rows}
            />
            {!revealed && (
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={checkWithAi} disabled={checking || answer.trim() === ""}>
                  {checking ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
                  {checking ? "Checking…" : "Check with AI"}
                </Button>
                <Button variant="neutral" onClick={() => setRevealed(true)}>
                  Show the answer
                </Button>
                {checking && (
                  <span className="text-xs text-muted-foreground">
                    This can take up to a minute with Claude Code.
                  </span>
                )}
              </div>
            )}
            {checkError && (
              <p role="alert" className="text-sm text-destructive">
                {checkError}
              </p>
            )}

            {revealed && currentCheck && <CheckFeedback check={currentCheck} />}

            {revealed && (
              <div className="space-y-3">
                {reference(current)}
                <p className="text-sm font-medium">
                  {currentCheck
                    ? `The AI suggests "${suggestsKnew ? "I knew it" : "Not yet"}". You decide.`
                    : "Did your answer say the same thing?"}
                </p>
                <div className="flex gap-2">
                  <Button variant={suggestsKnew ? "default" : "neutral"} onClick={() => rate(true)}>
                    I knew it
                  </Button>
                  <Button
                    variant={suggestsKnew ? "neutral" : "default"}
                    onClick={() => rate(false)}
                  >
                    Not yet
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="font-medium">{title}</h4>
      <ul className="list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// The AI comparison of the answer with the reference.
function CheckFeedback({ check }: { check: Check }) {
  const { grade } = check;
  return (
    <section
      className="space-y-3 rounded-base border bg-secondary-background p-4"
      aria-live="polite"
    >
      <h3 className="flex items-baseline justify-between gap-4 font-semibold">
        <span>{VERDICT_LABEL[grade.verdict]}</span>
        <span className="text-sm font-normal text-muted-foreground">{grade.score} of 5</span>
      </h3>
      <FeedbackList title="You covered" items={grade.covered} />
      <FeedbackList title="You missed" items={grade.missing} />
      <FeedbackList title="Mistakes" items={grade.mistakes} />
      <div>
        <h4 className="font-medium">Say it like this</h4>
        <p>{grade.better_answer}</p>
      </div>
      <div>
        <h4 className="font-medium">The next question an interviewer could ask</h4>
        <p>{grade.follow_up}</p>
      </div>
      <p className="text-xs text-muted-foreground">Checked by {check.model}.</p>
    </section>
  );
}
