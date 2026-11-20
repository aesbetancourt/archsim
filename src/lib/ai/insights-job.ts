// The insights document is written in the background on the server. The browser can reload or
// leave the page, and the job continues. The state is in memory, so a server stop ends the job.
// It is on globalThis: in development, a code reload can load this module two times.

/** The state of the insights job: idle, running since a time, or failed with an error. */
export type InsightsStatus =
  | { status: "idle" }
  | { status: "running"; startedAt: string }
  | { status: "failed"; error: string };

const shared = globalThis as { charretteInsightsJob?: InsightsStatus };

const current = (): InsightsStatus => shared.charretteInsightsJob ?? { status: "idle" };

/**
 * The state of the job. A failure is reported one time, then the state is idle again.
 * @returns The current state of the job.
 * @example
 * const { status } = insightsStatus();
 */
export function insightsStatus(): InsightsStatus {
  const state = current();
  if (state.status === "failed") shared.charretteInsightsJob = { status: "idle" };
  return state;
}

/**
 * Start the work in the background. A failure of the work goes into the state, not to the caller.
 * @param work The work that writes the insights document.
 * @returns True when the job starts. False when a job is already running.
 * @example
 * startInsightsJob(async () => {
 *   const { output } = await runModel({ prompt, systemPrompt, schema: insightsSchema });
 *   const insights = parseInsights(output);
 *   await addInsightsDocument(`Insights · ${insights.title}`, insightsHtml(insights, byline));
 * });
 */
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

/**
 * Set the state of the job to idle. For the tests.
 * @example
 * beforeEach(() => resetInsightsJob());
 */
export function resetInsightsJob(): void {
  shared.charretteInsightsJob = { status: "idle" };
}
