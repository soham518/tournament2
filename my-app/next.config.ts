import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Cache Components (Next 16's default-static model) requires every
  // session/request-dependent read to sit behind Suspense + "use cache: private".
  // This app's pages (auth, admin dashboards, payment queues, live brackets) are
  // almost all request-dependent, so we opt back into the conventional
  // (Next 15-style) rendering model instead of fighting that boundary everywhere.
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
