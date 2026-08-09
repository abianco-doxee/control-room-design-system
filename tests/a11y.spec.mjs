// Accessibility gate — runs axe-core over the living gallery (all tokens +
// components) in every theme. Fails CI on any serious/critical WCAG violation.

import { join } from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const GALLERY = pathToFileURL(join(process.cwd(), "public", "gallery.html")).href;
const THEMES = ["dark", "light", "extreme", "phosphor"];

for (const theme of THEMES) {
  test(`gallery a11y — ${theme}`, async ({ page }) => {
    await page.goto(GALLERY);
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await page.evaluate(() => document.fonts?.ready);

    // Scope to the component demos — we're gating the design system, not the
    // gallery's own chrome (search bar, swatch labels, nav links).
    const results = await new AxeBuilder({ page })
      .include(".demogrid")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    if (blocking.length) {
      console.log(
        `\n[${theme}] blocking a11y violations:\n` +
          blocking.map((v) => `  • ${v.id} (${v.impact}) ×${v.nodes.length} — ${v.help}`).join("\n")
      );
    }
    expect(blocking, blocking.map((v) => v.id).join(", ") || "none").toEqual([]);
  });
}
