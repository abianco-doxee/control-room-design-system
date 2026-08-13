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
// baselines" for this whole remediation and left the visual gate dark. Measured:
// 5s fails, 30s passes. Do not trim it back without re-measuring against the
// real page height.

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
const SNAPSHOT_DIR = join(dirname(fileURLToPath(import.meta.url)), "visual.spec.mjs-snapshots");
const platformSuffix =
  { darwin: "darwin", linux: "linux", win32: "win32" }[process.platform] ?? process.platform;

for (const theme of THEMES) {
  test(`component browser visual — ${theme}`, async ({ page }) => {
    const baseline = join(SNAPSHOT_DIR, `components-${theme}-chromium-${platformSuffix}.png`);
    expect(
      existsSync(baseline),
      `Missing baseline ${baseline}.\nPlaywright would silently create it and pass, leaving the visual gate dark.\nGenerate Linux baselines via the "Visual baselines" workflow (Actions → workflow_dispatch),\nor locally for this platform with: pnpm run test:visual:update`
    ).toBe(true);
    await page.goto(SHOWCASE);
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await page.evaluate(() => document.fonts?.ready);
    await expect(page).toHaveScreenshot(`components-${theme}.png`, {
      fullPage: true,
      animations: "disabled",
      timeout: 30_000,
    });
  });
}
