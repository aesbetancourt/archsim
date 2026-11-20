import { type TourId, tourIds } from "@/lib/content/tours";
import { jsonFile } from "./json-file";

// The tours that the person saw, with the time they finished or skipped each one.
export type Onboarding = { tours: Partial<Record<TourId, string>> };

const isTourId = (value: string): value is TourId => (tourIds as readonly string[]).includes(value);

function normalize(value: unknown): Onboarding {
  const tours = (value as Partial<Onboarding> | undefined)?.tours;
  if (!tours || typeof tours !== "object" || Array.isArray(tours)) return { tours: {} };
  return {
    tours: Object.fromEntries(
      Object.entries(tours).filter(
        (entry): entry is [TourId, string] => isTourId(entry[0]) && typeof entry[1] === "string",
      ),
    ),
  };
}

const store = jsonFile("onboarding.json", normalize);
export const readOnboarding = store.read;

// Mark a tour as seen. A tour that is not seen runs again the next time its page opens.
export function setTourSeen(tour: TourId, seen: boolean): Promise<Onboarding> {
  return store.change((onboarding) => {
    if (seen) onboarding.tours[tour] = new Date().toISOString();
    else delete onboarding.tours[tour];
    return onboarding;
  });
}
