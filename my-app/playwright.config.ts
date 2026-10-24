import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // Next.js 16's Turbopack dev server intermittently errors mid-stream on the
  // navigation immediately following a Server Action redirect or router.refresh()
  // (confirmed not to reproduce against a production build) — retries absorb
  // that dev-only flakiness without masking real app bugs, which fail consistently
  // across all attempts rather than passing on a later retry.
  retries: 3,
  use: {
    baseURL: "http://localhost:3000",
  },
});
