// The insights document is written in the background on the server. The browser can reload or
// leave the page, and the job continues. The state is in memory, so a server stop ends the job.
// It is on globalThis: in development, a code reload can load this module two times.

export type InsightsStatus =
  | { status: "idle" }
  | { status: "running"; startedAt: string }
  | { status: "failed"; error: string };

const shared = globalThis as { charretteInsightsJob?: InsightsStatus };

const current = (): InsightsStatus => shared.charretteInsightsJob ?? { status: "idle" };

// The state of the job. A failure is reported one time, then the state is idle again.
export function insightsStatus(): InsightsStatus {
  const state = current();
  if (state.status === "failed") shared.charretteInsightsJob = { status: "idle" };
  return state;
}

// Start the work in the background. Return false when a job is already running.
export function startInsightsJob(work: () => Promise<void>): boolean {
  if (current().status === "running") return false;
  shared.charretteInsightsJob = { status: "running", startedAt: new Date().toISOString() };
  work().then(
    () => {
      shared.charretteInsightsJob = { status: "idle" };
    },
    (error: unknown) => {
      shared.charretteInsightsJob = {
        status: "failed",
        error: error instanceof Error ? error.message : "The insights document was not made.",
      };
    },
  );
  return true;
}

// For the tests.
export function resetInsightsJob(): void {
  shared.charretteInsightsJob = { status: "idle" };
}
