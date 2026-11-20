"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TourId } from "@/lib/content/tours";
import type { Onboarding } from "@/lib/store/onboarding";
import { readOnboarding, setTourSeen } from "./api";
import { keys } from "./query-keys";

// The state of one tour. The tours load one time for each visit to the app. A change here is the
// only thing that changes them.
export function useTour(id: TourId) {
  const client = useQueryClient();
  const state = useQuery({
    queryKey: keys.onboarding,
    queryFn: readOnboarding,
    staleTime: Infinity,
  });

  // The page changes at once. If the save fails, the page changes back.
  const change = useMutation({
    mutationFn: (seen: boolean) => setTourSeen(id, seen),
    onMutate: async (seen) => {
      await client.cancelQueries({ queryKey: keys.onboarding });
      const before = client.getQueryData<Onboarding>(keys.onboarding);
      const tours = { ...before?.tours };
      if (seen) tours[id] = new Date().toISOString();
      else delete tours[id];
      client.setQueryData<Onboarding>(keys.onboarding, { tours });
      return { before };
    },
    onError: (_error, _seen, context) => {
      if (context?.before) client.setQueryData(keys.onboarding, context.before);
    },
  });

  return {
    // Run the tour when the state loaded and the person did not see it. Without the state, for
    // example when the server does not answer, the tour does not run.
    shouldRun: state.isSuccess && !state.data.tours[id],
    setSeen: (seen: boolean) => change.mutateAsync(seen),
  };
}
