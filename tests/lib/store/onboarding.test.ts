import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { onboardingUpdate } from "@/lib/requests";
import { readOnboarding, setTourSeen } from "@/lib/store/onboarding";

let dir: string;
const file = () => path.join(dir, "data", "onboarding.json");

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "charrette-onboarding-"));
  vi.spyOn(process, "cwd").mockReturnValue(dir);
});

describe("the onboarding tours", () => {
  it("starts with no tour seen", async () => {
    expect(await readOnboarding()).toEqual({ tours: {} });
  });

  it("marks a tour as seen, and as not seen again", async () => {
    await setTourSeen("welcome", true);
    expect(Object.keys((await readOnboarding()).tours)).toEqual(["welcome"]);

    await setTourSeen("welcome", false);
    const saved = JSON.parse(await readFile(file(), "utf8"));
    expect(saved.tours).toEqual({});
  });

  it("ignores a saved tour that is unknown", async () => {
    await mkdir(path.dirname(file()), { recursive: true });
    await writeFile(
      file(),
      // The kata tour existed before. A saved mark for it is ignored now.
      JSON.stringify({
        tours: { welcome: "2026-11-20T10:00:00.000Z", kata: "2026-11-20T10:05:00.000Z" },
      }),
    );
    expect(await readOnboarding()).toEqual({ tours: { welcome: "2026-11-20T10:00:00.000Z" } });
  });

  it("starts again when the file is damaged", async () => {
    await mkdir(path.dirname(file()), { recursive: true });
    await writeFile(file(), "{ not json");
    expect(await readOnboarding()).toEqual({ tours: {} });
  });

  it("accepts only a known tour in a request", () => {
    expect(onboardingUpdate.safeParse({ tour: "welcome", seen: true }).success).toBe(true);
    expect(onboardingUpdate.safeParse({ tour: "kata", seen: true }).success).toBe(false);
    expect(onboardingUpdate.safeParse({ tour: "welcome" }).success).toBe(false);
  });
});
