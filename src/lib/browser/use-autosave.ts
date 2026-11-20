"use client";

import { debounce } from "es-toolkit";
import { useEffect, useState } from "react";

/** The controls of an autosave. */
export type Autosave = {
  // A change happened. Save after the delay, unless a newer change comes first.
  schedule: () => void;
  // Save now, if a save is planned.
  flush: () => void;
  // Do not save the planned change.
  cancel: () => void;
  // A save is planned. A save that ends uses this to show "not saved yet" and not "saved".
  isPlanned: () => boolean;
  // Use a different save function for the next saves.
  setSave: (save: Save) => void;
};

/** A save function. It gets the autosave, so it can see a change that came while it saved. */
export type Save = (autosave: Autosave) => unknown;

/**
 * Make the timer of an autosave, without React.
 * @param save The function that saves.
 * @param delayMs The time to wait after the last change, in milliseconds.
 * @returns The controls of the autosave.
 * @example
 * const autosave = createAutosave(save, 1_000);
 * autosave.schedule();
 */
export function createAutosave(save: Save, delayMs: number): Autosave {
  let current = save;
  let planned = false;
  const run = debounce(() => {
    planned = false;
    void current(autosave);
  }, delayMs);
  const autosave: Autosave = {
    schedule: () => {
      planned = true;
      run();
    },
    flush: () => run.flush(),
    cancel: () => {
      planned = false;
      run.cancel();
    },
    isPlanned: () => planned,
    setSave: (next) => {
      current = next;
    },
  };
  return autosave;
}

/**
 * Save a short time after the last change. Save at once when the component closes, and before
 * a new save function replaces this one, so a planned change goes to the place it was made for.
 * Give a stable save function, for example from useCallback. A new function at each render saves
 * at each render.
 * @param save The function that saves.
 * @param delayMs The time to wait after the last change, in milliseconds.
 * @returns The controls of the autosave. They stay the same between renders.
 * @example
 * const autosave = useAutosave(save, SAVE_DELAY_MS);
 */
export function useAutosave(save: Save, delayMs: number): Autosave {
  const [autosave] = useState(() => createAutosave(save, delayMs));
  useEffect(() => {
    autosave.setSave(save);
    // This runs before the next setSave, so the planned change uses the save it was made for.
    return () => autosave.flush();
  }, [save, autosave]);
  return autosave;
}
