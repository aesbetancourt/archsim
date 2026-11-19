// The countdown clock of a kata. It copies the time box of a system design interview, with the
// points where an interviewer expects you to move on. This file has no server code.

export type Clock = {
  // The length of the time box, in minutes.
  minutes: number;
  // When the clock started, in milliseconds since 1970.
  startedAt: number;
  // The time on pause before the current run, in milliseconds.
  pausedMs: number;
  // When the current pause started. Null while the clock runs.
  pausedAt: number | null;
};

// The phases of the time box, as the fraction of the time at which each one ends.
// For 45 minutes: clarify to minute 5, a first design end to end by minute 15, deep dives to
// minute 40, and a wrap-up in the last 5 minutes.
export const phases = [
  {
    label: "Clarify and scope",
    end: 5 / 45,
    hint: "Ask your questions. Write the core functions and the characteristics (steps 1 and 2).",
  },
  {
    label: "First design, end to end",
    end: 15 / 45,
    hint: "Select a style and draw the happy path from start to end (steps 3 and 4). Do not go deep yet.",
  },
  {
    label: "Deep dives",
    end: 40 / 45,
    hint: "Go deep on the hard parts: data, failure, scale, and how you know it works.",
  },
  {
    label: "Wrap up",
    end: 1,
    hint: "Write the rationale: the trade-offs, the risks, and what you would do next (step 5).",
  },
] as const;

export const DURATIONS = [20, 30, 45, 60] as const;

export function startClock(minutes: number, now: number): Clock {
  return { minutes, startedAt: now, pausedMs: 0, pausedAt: null };
}

export function pauseClock(clock: Clock, now: number): Clock {
  return clock.pausedAt === null ? { ...clock, pausedAt: now } : clock;
}

export function resumeClock(clock: Clock, now: number): Clock {
  if (clock.pausedAt === null) return clock;
  return { ...clock, pausedMs: clock.pausedMs + (now - clock.pausedAt), pausedAt: null };
}

export type ClockState = {
  elapsedMs: number;
  // Below zero after the time is up.
  remainingMs: number;
  // The index in `phases`. The last phase stays after the time is up.
  phase: number;
  // The minute at which the current phase ends.
  phaseEndsAt: number;
  overtime: boolean;
  paused: boolean;
};

export function clockState(clock: Clock, now: number): ClockState {
  const until = clock.pausedAt ?? now;
  const elapsedMs = Math.max(0, until - clock.startedAt - clock.pausedMs);
  const totalMs = clock.minutes * 60_000;
  const fraction = elapsedMs / totalMs;
  const found = phases.findIndex((phase) => fraction < phase.end);
  const phase = found === -1 ? phases.length - 1 : found;
  return {
    elapsedMs,
    remainingMs: totalMs - elapsedMs,
    phase,
    phaseEndsAt: Math.round(phases[phase].end * clock.minutes),
    overtime: elapsedMs >= totalMs,
    paused: clock.pausedAt !== null,
  };
}

// "12:05", or "+1:30" after the time is up.
export function formatClock(remainingMs: number): string {
  const over = remainingMs < 0;
  // Count down in whole seconds that are not finished yet, as a kitchen timer does.
  const seconds = over ? Math.floor(-remainingMs / 1000) : Math.ceil(remainingMs / 1000);
  const text = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return over ? `+${text}` : text;
}

// Read a saved clock. A value that is not a clock gives null.
export function parseClock(raw: string | null): Clock | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Clock>;
    if (
      typeof value.minutes === "number" &&
      value.minutes > 0 &&
      typeof value.startedAt === "number" &&
      typeof value.pausedMs === "number" &&
      (value.pausedAt === null || typeof value.pausedAt === "number")
    ) {
      return value as Clock;
    }
  } catch {
    // Not JSON.
  }
  return null;
}

// The clock of each kata is saved in this browser, so it keeps running after a reload.
const key = (kataId: string) => `charrette:clock:${kataId}`;

export function loadClock(kataId: string): Clock | null {
  try {
    return parseClock(localStorage.getItem(key(kataId)));
  } catch {
    return null;
  }
}

export function saveClock(kataId: string, clock: Clock | null): void {
  try {
    if (clock) localStorage.setItem(key(kataId), JSON.stringify(clock));
    else localStorage.removeItem(key(kataId));
  } catch {
    // Storage is not available. The clock lasts for this page only.
  }
}
