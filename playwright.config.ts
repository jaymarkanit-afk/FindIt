import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against a production build (next build + next start),
// so they see the real security headers, image optimisation and fonts.
const PORT = 3100;

// The browser: Playwright's own Chromium (`npx playwright install chromium`),
// or an installed one with PW_CHANNEL=chrome or PW_CHANNEL=msedge, for
// machines where that download cannot be unpacked
const channel = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel } },
    { name: "phone", use: { ...devices["Pixel 7"], channel } },
  ],
});
