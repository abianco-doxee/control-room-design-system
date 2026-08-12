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

import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

const SHOWCASE = pathToFileURL(join(process.cwd(), "public", "components.html")).href;
const THEMES = ["dark", "light", "extreme", "phosphor"];

for (const theme of THEMES) {
  test(`component browser visual — ${theme}`, async ({ page }) => {
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
