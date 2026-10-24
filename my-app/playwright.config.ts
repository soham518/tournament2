import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // Next.js 16's Turbopack dev server intermittently errors mid-stream on the
  // navigation immediately following a Server Action redirect (confirmed not
  // to reproduce against a production build) — one retry absorbs that dev-only
  // flakiness without masking real app bugs, which fail consistently.
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
  },
});
