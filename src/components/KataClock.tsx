"use client";

import { Bell, BellOff, Pause, Play, Square, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  type Clock,
  clockState,
  DURATIONS,
  formatClock,
  loadClock,
  pauseClock,
  phases,
  resumeClock,
  saveClock,
  startClock,
} from "@/lib/kata-clock";
import { cn } from "@/lib/utils";

const SOUND_KEY = "charrette:clock-sound";

// A short, soft tone when a phase ends. The browser plays it only after a click on the page.
function chime() {
  try {
    const context = new AudioContext();
    const tone = context.createOscillator();
    const gain = context.createGain();
    tone.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.9);
    tone.connect(gain).connect(context.destination);
    tone.start();
    tone.stop(context.currentTime + 1);
    tone.onended = () => void context.close();
  } catch {
    // No audio in this browser. The clock still shows the phase.
  }
}

// The countdown clock of a kata, for practice under the time of an interview.
// It shows the phase that an interviewer expects now, and the minute at which it ends.
export default function KataClock({ kataId, interview }: { kataId: string; interview: boolean }) {
  const [clock, setClock] = useState<Clock | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [sound, setSound] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const lastPhase = useRef<number | null>(null);

  // localStorage exists only in the browser, so the saved clock loads after the first render.
  useEffect(() => {
    /* oxlint-disable react/set-state-in-effect */
    setClock(loadClock(kataId));
    setNow(Date.now());
    try {
      setSound(localStorage.getItem(SOUND_KEY) !== "off");
    } catch {
      // Storage is not available. Keep the sound on.
    }
    /* oxlint-enable react/set-state-in-effect */
  }, [kataId]);

  const running = clock !== null && clock.pausedAt === null;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const state = clock ? clockState(clock, now) : null;
  // The index of the phase, with one more step when the time is up.
  const step = state ? state.phase + (state.overtime ? 1 : 0) : null;

  // Play the tone when a phase ends, not when the page opens on a running clock.
  useEffect(() => {
    if (step === null) {
      lastPhase.current = null;
      return;
    }
    if (lastPhase.current !== null && step > lastPhase.current && sound) chime();
    lastPhase.current = step;
  }, [step, sound]);

  function update(next: Clock | null) {
    setClock(next);
    setNow(Date.now());
    saveClock(kataId, next);
  }

  function toggleSound() {
    setSound((current) => {
      try {
        localStorage.setItem(SOUND_KEY, current ? "off" : "on");
      } catch {
        // Storage is not available. The choice lasts for this page only.
      }
      return !current;
    });
  }

  if (!clock || !state) {
    if (!choosing) {
      return (
        <Button variant="neutral" size="sm" className="w-full" onClick={() => setChoosing(true)}>
          <Timer /> Practice under time
        </Button>
      );
    }
    return (
      <div className="space-y-2 rounded-base border bg-background p-3">
        <p className="text-xs text-muted-foreground">
          Select the time box. {interview ? "An interview gives you about 45 minutes." : ""} The
          clock shows when to move on, as an interviewer expects.
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {DURATIONS.map((minutes) => (
            <Button
              key={minutes}
              size="xs"
              variant={minutes === 45 ? "default" : "neutral"}
              onClick={() => {
                setChoosing(false);
                update(startClock(minutes, Date.now()));
              }}
            >
              {minutes} min
            </Button>
          ))}
          <Button size="xs" variant="ghost" className="ml-auto" onClick={() => setChoosing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  const phase = phases[state.phase];
  const totalMs = clock.minutes * 60_000;
  const done = Math.min(1, state.elapsedMs / totalMs);

  return (
    <section
      aria-label="Kata clock"
      className={cn(
        "space-y-2 rounded-base border bg-background p-3",
        state.overtime && "border-destructive",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          role="timer"
          aria-label={state.overtime ? "Time over" : "Time left"}
          className={cn(
            "text-2xl font-semibold tabular-nums",
            state.overtime && "text-destructive",
            state.paused && "opacity-60",
          )}
        >
          {formatClock(state.remainingMs)}
        </span>
        <span className="text-xs text-muted-foreground">
          {state.paused ? "paused" : `of ${clock.minutes} min`}
        </span>
        <div className="ml-auto flex gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={sound ? "Turn off the tone" : "Turn on the tone"}
            title={sound ? "A tone plays when a phase ends" : "No tone"}
            aria-pressed={sound}
            onClick={toggleSound}
          >
            {sound ? <Bell /> : <BellOff />}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={state.paused ? "Continue the clock" : "Pause the clock"}
            title={state.paused ? "Continue" : "Pause"}
            onClick={() =>
              update(state.paused ? resumeClock(clock, Date.now()) : pauseClock(clock, Date.now()))
            }
          >
            {state.paused ? <Play /> : <Pause />}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Stop the clock"
            title="Stop"
            onClick={() => update(null)}
          >
            <Square />
          </Button>
        </div>
      </div>

      {/* The bar shows the time used, with a mark at the end of each phase. */}
      <div className="relative h-2 rounded-full bg-muted" aria-hidden>
        <div
          className={cn("h-full rounded-full", state.overtime ? "bg-destructive" : "bg-primary")}
          style={{ width: `${done * 100}%` }}
        />
        {phases.slice(0, -1).map((item) => (
          <span
            key={item.label}
            className="absolute top-1/2 h-3.5 w-px -translate-y-1/2 bg-foreground/60"
            style={{ left: `${item.end * 100}%` }}
          />
        ))}
      </div>

      <div aria-live="polite">
        {state.overtime ? (
          <p className="font-medium text-destructive">
            Time is up. Finish your sentence and submit.
          </p>
        ) : (
          <>
            <p className="font-medium">
              {state.phase + 1} of {phases.length}: {phase.label}
              <span className="font-normal text-muted-foreground">
                {" "}
                · until minute {state.phaseEndsAt}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">{phase.hint}</p>
          </>
        )}
      </div>
    </section>
  );
}
