import { onboardingUpdate, readBody } from "@/lib/requests";
import { readOnboarding, setTourSeen } from "@/lib/store/onboarding";

export async function GET() {
  return Response.json(await readOnboarding());
}

// Mark one tour as seen, or not seen.
export async function PUT(request: Request) {
  const update = await readBody(request, onboardingUpdate);
  if (update instanceof Response) return update;
  return Response.json(await setTourSeen(update.tour, update.seen));
}
