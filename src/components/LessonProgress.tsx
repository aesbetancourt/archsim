"use client";

import { Circle, CircleCheck, Target, Undo2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setDone, useProgress } from "@/lib/use-progress";

// A badge in the lesson header when the lesson is done.
export function DoneBadge({ slug }: { slug: string }) {
  const done = useProgress();
  if (!done[slug]) return null;
  return (
    <Badge>
      <CircleCheck className="size-3.5" aria-hidden /> Done
    </Badge>
  );
}

// The learning objectives of a lesson. When the lesson is done, each objective has a check.
export function LessonObjectives({ slug, objectives }: { slug: string; objectives: string[] }) {
  const finished = Boolean(useProgress()[slug]);
  const Mark = finished ? CircleCheck : Circle;
  return (
    <section
      aria-labelledby="objectives-title"
      className="space-y-2 rounded-base border-2 bg-card px-4 py-3"
    >
      <h2 id="objectives-title" className="flex items-center gap-2 font-medium">
        <Target className="size-4 text-primary" aria-hidden /> You will learn to
      </h2>
      <ul className="space-y-1">
        {objectives.map((item) => (
          <li key={item} className="flex gap-2">
            <Mark
              className={
                finished
                  ? "mt-1 size-4 shrink-0 text-primary"
                  : "mt-1 size-4 shrink-0 text-muted-foreground"
              }
              aria-hidden
            />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

// The button at the end of a lesson that marks it as done, or not done again.
export function MarkDone({ slug }: { slug: string }) {
  const finished = Boolean(useProgress()[slug]);
  const [error, setError] = useState("");

  async function toggle() {
    setError("");
    try {
      await setDone(slug, !finished);
    } catch (thrown) {
      setError((thrown as Error).message);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-base border-2 bg-card px-4 py-3">
      {finished ? (
        <>
          <p className="flex flex-1 items-center gap-2 font-medium">
            <CircleCheck className="size-4 text-primary" aria-hidden /> You marked this lesson as
            done.
          </p>
          <Button variant="neutral" size="sm" onClick={toggle}>
            <Undo2 /> Mark as not done
          </Button>
        </>
      ) : (
        <>
          <p className="flex-1 text-muted-foreground">
            Can you do each point in the list at the top? Then mark the lesson as done.
          </p>
          <Button size="sm" onClick={toggle}>
            <CircleCheck /> Mark as done
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="w-full">
          {error}
        </p>
      )}
    </div>
  );
}
