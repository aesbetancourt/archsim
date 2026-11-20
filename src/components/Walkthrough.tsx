"use client";

import {
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  Pause,
  Play,
  PlayCircle,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import Diagram from "@/components/Diagram";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type Change,
  formatMetric,
  resolveSteps,
  type StepKind,
  type Walkthrough as WalkthroughData,
} from "@/lib/content/walkthrough";

const kindLabel: Record<StepKind, string> = {
  problem: "Problem",
  idea: "Idea",
  technique: "Technique",
  failure: "Failure",
  recap: "Recap",
};

const kindClass: Record<StepKind, string> = {
  // The washes of the building blocks, so a walkthrough matches its diagram.
  problem: "bg-[#ebbcb0] text-black",
  idea: "bg-[#ecd394] text-black",
  technique: "bg-[#c2d8ad] text-black",
  failure: "bg-[#e3a79b] text-black",
  recap: "bg-[#b7cde2] text-black",
};

const signClass: Record<Change["sign"], string> = {
  "+": "text-[#2f9e44]",
  "-": "text-muted-foreground",
  "~": "text-[#e8590c]",
  "!": "text-[#e03131]",
};

// Whether a changed number got better. A metric without a better direction, or a value that is
// text, gives no answer.
function improved(
  direction: "lower" | "higher" | undefined,
  value: number | string | undefined,
  before: number | string | undefined,
): boolean | undefined {
  if (!direction || typeof value !== "number" || typeof before !== "number") return undefined;
  return (direction === "lower") === value < before;
}

// The colors of a button in the step list: the step on the screen, a step before it, or a later step.
function stepButtonClass(position: number, current: number): string {
  if (position === current) return "bg-main text-main-foreground";
  if (position < current) return "bg-primary/15";
  return "bg-card text-muted-foreground hover:bg-muted";
}

// A lesson in steps on one diagram. The reader moves with the buttons, the step list, or the
// arrow keys when the walkthrough has the focus.
export default function Walkthrough({ walkthrough }: { walkthrough: WalkthroughData }) {
  const steps = useMemo(() => resolveSteps(walkthrough), [walkthrough]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const figure = useRef<HTMLDivElement>(null);
  const step = walkthrough.steps[index];
  const state = steps[index];
  const previous = index > 0 ? steps[index - 1] : undefined;
  const last = steps.length - 1;

  const svg = () => figure.current?.querySelector("svg");
  function go(next: number) {
    setIndex(Math.min(last, Math.max(0, next)));
    setPaused(false);
    svg()?.unpauseAnimations();
  }
  function replay() {
    svg()?.setCurrentTime(0);
    svg()?.unpauseAnimations();
    setPaused(false);
  }
  function togglePause() {
    if (paused) svg()?.unpauseAnimations();
    else svg()?.pauseAnimations();
    setPaused(!paused);
  }

  const view = useMemo(
    () => ({
      visible: new Set(state.visible),
      edges: new Set(state.edges),
      flows: state.flows,
      focus: new Set(state.focus),
      down: new Set(state.down),
      notes: state.notes,
      step: index,
    }),
    [state, index],
  );

  return (
    // The arrow keys move between steps. The buttons do the same for a pointer and for Tab.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <section
      aria-label={`Walkthrough: ${walkthrough.title}`}
      // The read-aloud player skips the walkthrough. Its steps are controls, not text.
      data-read-skip
      className="not-prose space-y-3 rounded-base border bg-secondary-background p-3 shadow-shadow sm:p-4"
      onKeyDown={(event) => {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
          return;
        if (event.key === "ArrowRight") go(index + 1);
        else if (event.key === "ArrowLeft") go(index - 1);
        else return;
        event.preventDefault();
      }}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <PlayCircle className="size-4 text-primary" aria-hidden /> {walkthrough.title}
        </h3>
        <div className="flex gap-1">
          <Button variant="neutral" size="xs" onClick={replay}>
            <RotateCcw /> Replay
          </Button>
          <Button variant="neutral" size="xs" onClick={togglePause} aria-pressed={paused}>
            {paused ? <Play /> : <Pause />} {paused ? "Play" : "Pause"}
          </Button>
        </div>
      </header>

      {walkthrough.metrics.length > 0 && (
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {walkthrough.metrics.map((metric) => {
            const value = state.metrics[metric.id];
            const before = previous?.metrics[metric.id];
            const changed = previous !== undefined && before !== value;
            const better = changed ? improved(metric.better, value, before) : undefined;
            return (
              <div
                key={metric.id}
                className={cn(
                  "rounded-base border bg-card px-3 py-2 transition-colors",
                  better === true && "border-[#2f9e44]",
                  better === false && "border-[#e03131]",
                )}
              >
                <dt className="text-xs text-muted-foreground uppercase">{metric.label}</dt>
                <dd className="font-mono text-base font-semibold tabular-nums">
                  {formatMetric(value, metric.unit)}
                </dd>
              </div>
            );
          })}
        </dl>
      )}

      <div ref={figure}>
        <Diagram spec={walkthrough.diagram} view={view} />
      </div>

      <div aria-live="polite" className="space-y-3 rounded-base border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "rounded-base border border-border px-2 py-0.5 text-xs font-semibold",
              kindClass[step.kind],
            )}
          >
            {kindLabel[step.kind]}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            Step {index + 1} of {steps.length}
          </span>
        </div>
        <h4 className="text-lg font-semibold">{step.title}</h4>
        {step.text.split(/\n\s*\n/).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {step.key && (
          <div className="flex gap-2 rounded-base border border-dashed border-primary/60 bg-primary/5 px-3 py-2">
            {step.kind === "failure" ? (
              <TriangleAlert className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            ) : (
              <Lightbulb className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            )}
            <p>
              <span className="font-semibold">Key idea: </span>
              {step.key}
            </p>
          </div>
        )}
        {state.changes.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-muted-foreground uppercase">What changed</h5>
            <ul className="mt-1 space-y-0.5 font-mono text-[0.8125rem]">
              {state.changes.map((change) => (
                <li key={`${change.sign}${change.text}`} className="flex gap-2">
                  <span className={cn("w-3 shrink-0 font-bold", signClass[change.sign])}>
                    {change.sign}
                  </span>
                  {change.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="neutral" size="sm" onClick={() => go(index - 1)} disabled={index === 0}>
          <ArrowLeft /> Back
        </Button>
        <span className="hidden text-xs text-muted-foreground sm:inline">← → to move</span>
        <Button size="sm" onClick={() => go(index + 1)} disabled={index === last}>
          {index === last ? "End" : `Next: ${walkthrough.steps[index + 1].title}`}
          {index < last && <ArrowRight />}
        </Button>
      </div>

      <ol aria-label="Steps" className="flex flex-wrap gap-1.5">
        {walkthrough.steps.map((item, position) => (
          <li key={item.title}>
            <button
              type="button"
              title={item.title}
              aria-label={`Step ${position + 1}: ${item.title}`}
              aria-current={position === index ? "step" : undefined}
              onClick={() => go(position)}
              className={cn(
                "flex size-7 items-center justify-center rounded-full border border-border text-xs font-semibold tabular-nums",
                stepButtonClass(position, index),
              )}
            >
              {position + 1}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
