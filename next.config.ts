import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Check each page address in a link at type-check time.
  typedRoutes: true,
  // Let a phone on the home network use the dev server. Without this, `next dev` blocks the
  // dev socket from a LAN address, and the page does not hydrate, so no button works.
  allowedDevOrigins: ["192.168.*.*"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
