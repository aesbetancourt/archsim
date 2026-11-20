import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Check each page address in a link at type-check time.
  typedRoutes: true,
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
