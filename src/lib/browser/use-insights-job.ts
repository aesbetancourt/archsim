"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useRef } from "react";
import { insightsStatus, startInsights } from "./api";
import { keys } from "./query-keys";

// How often the page asks for the state of the job, in milliseconds.
const POLL_MS = 3_000;

/**
 * Follow the job that writes an insights document. The job runs in the background on the
 * server, so the person can reload or leave the page. The page asks for the state when it opens,
 * and again every few seconds while the job runs.
 * @returns Whether the job runs now, and a function that starts a job. That function throws when
 * the server refuses.
 * @example
 * const job = useInsightsJob({ enabled: open, onDone: refresh, onFailed: showError });
 */
export function useInsightsJob({
  enabled,
  onDone,
  onFailed,
}: {
  // Only the Notebook page shows the job.
  enabled: boolean;
  // The job ended, so there can be a new note.
  onDone: () => void;
  // The job failed. The server gives the reason one time.
  onFailed: (reason: string) => void;
}) {
  const client = useQueryClient();
  // The page saw a running job. Then the end of the job is news.
  const expecting = useRef(false);

  const state = useQuery({
    queryKey: keys.insights,
    queryFn: insightsStatus,
    enabled,
    // Do not keep the state for a later visit to the page. The server reports a failure one time,
    // and an old copy would show it again.
    gcTime: 0,
    // Ask again while the job runs. Ask again also when the server did not answer.
    refetchInterval: (query) =>
      query.state.status === "error" || query.state.data?.status === "running" ? POLL_MS : false,
  });

  const report = useEffectEvent(() => {
    const job = state.data;
    if (!job) return;
    if (job.status === "running") {
      expecting.current = true;
      return;
    }
    if (job.status === "failed") onFailed(job.error);
    if (expecting.current) {
      expecting.current = false;
      onDone();
    }
  });
  // Each answer of the server is news one time, also when it is the same as the answer before.
  useEffect(() => report(), [state.dataUpdatedAt]);

  // Start a job. This function throws when the server refuses.
  async function start(): Promise<void> {
    client.setQueryData(keys.insights, await startInsights());
    // Ask for the state now. This also stops an older request, so its answer does not count.
    void state.refetch();
  }

  return { writing: state.data?.status === "running", start };
}
