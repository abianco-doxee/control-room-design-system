// Accessibility gate — runs axe-core over the per-component browser
// (components.html) in every theme. Same contract as the gallery gate: fail CI
// on any serious/critical WCAG violation in the rendered components.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const SHOWCASE = pathToFileURL(join(process.cwd(), "public", "components.html")).href;
const THEMES = ["dark", "light", "extreme", "phosphor"];

for (const theme of THEMES) {
  test(`component browser a11y — ${theme}`, async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await page.evaluate(() => document.fonts?.ready);

    // Scope to the rendered component stages — we're gating the design system,
    // not the browser's own chrome (index, badges, meta tables).
    const results = await new AxeBuilder({ page })
      .include(".stage")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    if (blocking.length) {
      console.log(
        `\n[${theme}] blocking a11y violations:\n` +
          blocking.map((v) => `  • ${v.id} (${v.impact}) ×${v.nodes.length} — ${v.help}`).join("\n"),
      );
    }
    expect(blocking, blocking.map((v) => v.id).join(", ") || "none").toEqual([]);
  });
}
