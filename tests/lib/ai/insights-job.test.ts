import { beforeEach, describe, expect, it } from "vitest";
import { insightsStatus, resetInsightsJob, startInsightsJob } from "@/lib/ai/insights-job";

// A job that the test finishes when it wants.
function deferred() {
  let finish!: () => void;
  let fail!: (error: Error) => void;
  const promise = new Promise<void>((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });
  return { work: () => promise, finish, fail, promise };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => resetInsightsJob());

describe("insights job", () => {
  it("runs one job at a time, and is idle when it ends", async () => {
    const job = deferred();
    expect(startInsightsJob(job.work)).toBe(true);
    expect(startInsightsJob(job.work)).toBe(false);
    expect(insightsStatus().status).toBe("running");

    job.finish();
    await settle();
    expect(insightsStatus()).toEqual({ status: "idle" });
  });

  it("reports a failure one time", async () => {
    const job = deferred();
    startInsightsJob(job.work);
    job.fail(new Error("The model is busy."));
    await settle();

    expect(insightsStatus()).toEqual({ status: "failed", error: "The model is busy." });
    expect(insightsStatus()).toEqual({ status: "idle" });
  });
});
