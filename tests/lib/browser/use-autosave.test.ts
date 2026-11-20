import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAutosave } from "@/lib/browser/use-autosave";

const DELAY = 1000;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("an autosave", () => {
  it("saves one time, after the delay that follows the last change", () => {
    const save = vi.fn();
    const autosave = createAutosave(save, DELAY);
    autosave.schedule();
    vi.advanceTimersByTime(DELAY / 2);
    autosave.schedule();
    vi.advanceTimersByTime(DELAY - 1);
    expect(save).not.toHaveBeenCalled();
    expect(autosave.isPlanned()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(autosave.isPlanned()).toBe(false);
  });

  it("saves at once on flush, and only when a save is planned", () => {
    const save = vi.fn();
    const autosave = createAutosave(save, DELAY);
    autosave.flush();
    expect(save).not.toHaveBeenCalled();
    autosave.schedule();
    autosave.flush();
    expect(save).toHaveBeenCalledTimes(1);
    // The timer of the flushed change does not save again.
    vi.advanceTimersByTime(DELAY);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("does not save a canceled change", () => {
    const save = vi.fn();
    const autosave = createAutosave(save, DELAY);
    autosave.schedule();
    autosave.cancel();
    expect(autosave.isPlanned()).toBe(false);
    vi.advanceTimersByTime(DELAY);
    autosave.flush();
    expect(save).not.toHaveBeenCalled();
  });

  it("uses the newest save function", () => {
    const first = vi.fn();
    const second = vi.fn();
    const autosave = createAutosave(first, DELAY);
    autosave.schedule();
    autosave.setSave(second);
    vi.advanceTimersByTime(DELAY);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("knows about a change that comes while a save runs", async () => {
    let finish = () => {};
    const autosave = createAutosave(
      () => new Promise<void>((resolve) => (finish = resolve)),
      DELAY,
    );
    autosave.schedule();
    vi.advanceTimersByTime(DELAY);
    expect(autosave.isPlanned()).toBe(false);
    autosave.schedule();
    finish();
    expect(autosave.isPlanned()).toBe(true);
  });
});
