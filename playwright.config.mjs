import { defineConfig, devices } from "@playwright/test";

// Local runs (Claude env) point at the pre-installed Chromium via PW_CHROMIUM.
// CI installs its own matching browser, so PW_CHROMIUM is unset there.
const executablePath = process.env.PW_CHROMIUM || undefined;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["line"]] : "line",
  use: {
    reducedMotion: "reduce",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // visual tolerance — small cross-environment rendering differences shouldn't flake
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.05, threshold: 0.2 } },
});
