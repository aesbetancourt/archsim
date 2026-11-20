"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// The cache of the data that the browser gets from the server, for example the lesson progress
// and the bookmarks. Components that use the same key share one copy of the data.
// The keys are in lib/browser/query-keys.ts.
//
// The defaults fit this app: one person, and a server on the same computer.
function makeClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Send each request also when the browser says that it is offline. The server is on this
        // computer, so it answers with no network.
        networkMode: "always",
        // A failed request is not sent again by itself. The person sees the failure at once.
        retry: false,
        // A return to the window does not mean that the data changed.
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: { networkMode: "always", retry: false },
    },
  });
}

let browserClient: QueryClient | undefined;

function getClient(): QueryClient {
  // Each render on the server gets its own cache. The browser keeps one cache.
  if (typeof window === "undefined") return makeClient();
  browserClient ??= makeClient();
  return browserClient;
}

export default function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={getClient()}>{children}</QueryClientProvider>;
}
