// Visual regression — full-page snapshot of the component browser per theme.
// Baselines live in tests/visual.spec.mjs-snapshots/ and are platform-suffixed.
// Regenerate after intentional visual changes: npm run test:visual:update
//
// The timeout below is load-bearing, not padding. The browser page is ~63,000px
// tall, so ONE full-page capture costs about a second and ~1.8MB. Playwright
// takes repeated shots until two are byte-identical before it will compare, and
// under the default 5s budget it cannot fit enough frames — the run dies with
// "Failed to take two consecutive stable screenshots" REGARDLESS of platform or
// whether a baseline exists. That failure mode masqueraded as "missing
// baselines" for this whole remediation and left the visual gate dark.
//
// Sizing it, measured twice:
//   - 5s fails, 30s passes — on a local macOS machine.
//   - 30s is NOT enough on a GitHub ubuntu-latest runner. Writing baselines
//     there took 50s for all four themes, but COMPARING against an existing
//     one is far dearer (a ~1.8MB diff of a 64,000px image): 3 of 4 themes
//     blew the 30s budget and the one that survived took 2.2 minutes.
// Hence 180s — 2.2min observed plus headroom for a noisier runner. This is a
// per-test ceiling, not a sleep: a fast local run still finishes in ~25s.
// Do not trim it back without re-measuring ON CI, not just locally.

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

const SHOWCASE = pathToFileURL(join(process.cwd(), "public", "components.html")).href;
const THEMES = ["dark", "light", "extreme", "phosphor"];

// Playwright WRITES a missing baseline and passes the run. On CI that reads as a
// green visual gate that compared nothing — the exact failure this suite is
// supposed to catch. Assert the baseline exists first so a missing one fails
// loudly and names the workflow that produces it.
// Baselines are platform-suffixed, so they must be generated on the platform the
// gate runs on: `.github/workflows/visual-baselines.yml` (workflow_dispatch).
//
// EXCEPT under --update-snapshots, where writing the missing file is the whole
// point. Guarding unconditionally deadlocks: the generator run fails on the
// absent baseline it was invoked to create, so the set can never be bootstrapped.
// `updateSnapshots` is "all"/"changed"/"missing" when updating, "none" otherwise.
const SNAPSHOT_DIR = join(dirname(fileURLToPath(import.meta.url)), "visual.spec.mjs-snapshots");
const platformSuffix =
  { darwin: "darwin", linux: "linux", win32: "win32" }[process.platform] ?? process.platform;

for (const theme of THEMES) {
  test(`component browser visual — ${theme}`, async ({ page }, testInfo) => {
    // Per-test, not in playwright.config.mjs: the other suites in this project
    // are fast and should keep failing quickly. Only this one pays the
    // 64,000px-diff cost. Playwright's default is 30s, which is also the
    // assertion timeout below — so an overrun reported "Test timeout of
    // 30000ms" while the real ceiling being hit was ambiguous between the two.
    test.setTimeout(180_000);
    const updating = testInfo.config.updateSnapshots !== "none";
    const baseline = join(SNAPSHOT_DIR, `components-${theme}-chromium-${platformSuffix}.png`);
    if (!updating) {
      expect(
        existsSync(baseline),
        `Missing baseline ${baseline}.\nPlaywright would silently create it and pass, leaving the visual gate dark.\nGenerate Linux baselines via the "Visual baselines" workflow (Actions → workflow_dispatch),\nor locally for this platform with: pnpm run test:visual:update`
      ).toBe(true);
    }
    await page.goto(SHOWCASE);
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await page.evaluate(() => document.fonts?.ready);
    await expect(page).toHaveScreenshot(`components-${theme}.png`, {
      fullPage: true,
      animations: "disabled",
      // Sits under the 180s test ceiling set above, so an overrun here reports
      // as a screenshot failure rather than a bare test timeout.
      timeout: 150_000,
    });
  });
}
