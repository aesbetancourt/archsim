import { onboardingUpdate, readBody } from "@/lib/requests";
import { readOnboarding, setTourSeen } from "@/lib/store/onboarding";

/**
 * Get the tours that the user has seen.
 * @returns The onboarding state, with the time each tour was seen.
 */
export async function GET() {
  return Response.json(await readOnboarding());
}

/**
 * Mark one tour as seen, or not seen.
 * @param request The request. Its body has the tour and the seen flag.
 * @returns The new onboarding state, or 400 when the body is not valid.
 */
export async function PUT(request: Request) {
  const update = await readBody(request, onboardingUpdate);
  if (update instanceof Response) return update;
  return Response.json(await setTourSeen(update.tour, update.seen));
}
