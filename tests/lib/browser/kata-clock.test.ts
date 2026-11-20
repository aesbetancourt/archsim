import { describe, expect, it } from "vitest";
import {
  clockState,
  formatClock,
  parseClock,
  pauseClock,
  resumeClock,
  startClock,
} from "@/lib/browser/kata-clock";

const MIN = 60_000;

describe("clockState", () => {
  it("moves through the phases of a 45-minute time box", () => {
    const clock = startClock(45, 0);
    expect(clockState(clock, 0).phase).toBe(0);
    expect(clockState(clock, 4 * MIN).phaseEndsAt).toBe(5);
    expect(clockState(clock, 5 * MIN).phase).toBe(1);
    expect(clockState(clock, 14 * MIN).phaseEndsAt).toBe(15);
    expect(clockState(clock, 20 * MIN).phase).toBe(2);
    expect(clockState(clock, 41 * MIN).phase).toBe(3);
  });

  it("scales the phases to the length of the time box", () => {
    const clock = startClock(30, 0);
    expect(clockState(clock, 0).phaseEndsAt).toBe(3);
    expect(clockState(clock, 5 * MIN).phaseEndsAt).toBe(10);
  });

  it("does not count the time on pause", () => {
    let clock = startClock(45, 0);
    clock = pauseClock(clock, 10 * MIN);
    expect(clockState(clock, 30 * MIN).elapsedMs).toBe(10 * MIN);
    expect(clockState(clock, 30 * MIN).paused).toBe(true);
    clock = resumeClock(clock, 30 * MIN);
    expect(clockState(clock, 32 * MIN).elapsedMs).toBe(12 * MIN);
  });

  it("goes on counting after the time is up", () => {
    const state = clockState(startClock(20, 0), 21 * MIN);
    expect(state.overtime).toBe(true);
    expect(state.remainingMs).toBe(-MIN);
    expect(state.phase).toBe(3);
  });
});

describe("formatClock", () => {
  it("shows minutes and seconds, and the time over with a plus", () => {
    expect(formatClock(45 * MIN)).toBe("45:00");
    expect(formatClock(65_400)).toBe("1:06");
    expect(formatClock(-90_000)).toBe("+1:30");
  });
});

describe("parseClock", () => {
  it("reads a saved clock and rejects other values", () => {
    const clock = startClock(45, 1000);
    expect(parseClock(JSON.stringify(clock))).toEqual(clock);
    expect(parseClock("{")).toBeNull();
    expect(
      parseClock(JSON.stringify({ minutes: 0, startedAt: 1, pausedMs: 0, pausedAt: null })),
    ).toBeNull();
    expect(parseClock(null)).toBeNull();
  });
});
