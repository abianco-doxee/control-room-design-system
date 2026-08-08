// The Component Browser's live islands are the REAL compiled React components
// (dist/frameworks/react), mounted client-side. This gate proves they actually
// mount, error-free, and stay interactive — so the browser can't silently
// regress to dead markup.
import { test, expect } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const SHOWCASE = pathToFileURL(join(process.cwd(), "public", "components.html")).href;

test.describe("component browser — live islands", () => {
  test("every island mounts the real component with no errors", async ({ page }) => {
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));

    // registry (DEMOS keys) and the mount points the generator emitted must match —
    // this is the drift guard between build-showcase.mjs's ISLAND_IDS and the entry.
    const registry = await page.evaluate(() => window.__CR_ISLANDS__.slice().sort());
    const mounts = await page.$$eval("[data-island]", (els) =>
      els.map((e) => e.getAttribute("data-island")).sort());
    expect(mounts).toEqual(registry);
    expect(mounts.length).toBeGreaterThanOrEqual(22);

    // each mount hydrated (ready flag set, no error flag)
    await expect(page.locator("[data-island]:not([data-island-ready])")).toHaveCount(0);
    const failed = await page.$$eval("[data-island][data-island-error]", (els) =>
      els.map((e) => `${e.getAttribute("data-island")}: ${e.getAttribute("data-island-error")}`));
    expect(failed, failed.join(", ") || "none").toEqual([]);

    expect(errors, errors.join("\n") || "none").toEqual([]);
  });

  test("islands are interactive, not static markup", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const scope = (id) => page.locator(`[data-island="${id}"]`);

    // tabs: selecting a tab updates the controlled panel + aria-selected
    const tabs = scope("tabs");
    await tabs.getByRole("tab").nth(2).click();
    await expect(tabs.getByRole("tab").nth(2)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.locator("p")).toContainText("panel 3");

    // switch: toggles its controlled state
    const sw = scope("switch").getByRole("switch");
    const before = await sw.getAttribute("aria-checked");
    await sw.click();
    await expect(sw).not.toHaveAttribute("aria-checked", before || "");

    // accordion: header toggles aria-expanded
    const hdr = scope("accordion").getByRole("button").nth(1);
    const wasOpen = (await hdr.getAttribute("aria-expanded")) === "true";
    await hdr.click();
    await expect(hdr).toHaveAttribute("aria-expanded", wasOpen ? "false" : "true");
  });

  test("schema-driven form validates and coerces via the ArkType core", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const form = page.locator('[data-island="form"]');

    // submit empty → required fields error AND the form-level summary appears
    await form.locator('button[type="submit"]').click();
    expect(await form.locator(".cr-field__error").count()).toBeGreaterThanOrEqual(4);
    await expect(form.locator(".cr-form__summary")).toBeVisible();
    expect(await form.locator(".cr-form__summary-link").count()).toBeGreaterThanOrEqual(4);

    // fix every field, incl. the nested `limits` group and the two autocompletes
    await form.locator("#cr-form-name").fill("nova-01");
    await form.locator("#cr-form-endpoint").fill("https://eu.example.com");
    await form.locator("#cr-form-replicas").fill("4");
    // region: searchable enum (static source) — type + pick
    await form.locator("#cr-form-region").fill("eu");
    await form.locator("#cr-form-region-list [role=option]").first().click();
    // owner: ASYNC source — type, wait for the remote list, pick
    await form.locator("#cr-form-owner").fill("ada");
    await expect(form.locator("#cr-form-owner-list [role=option]").first()).toContainText("Ada");
    await form.locator("#cr-form-owner-list [role=option]").first().click();
    await expect(form.locator("#cr-form-owner")).toHaveValue(/Ada/);
    await form.locator("#cr-form-limits-cpu").fill("2");
    await form.locator("#cr-form-limits-memGB").fill("8");
    await form.locator('button[type="submit"]').click();
    await expect(form.locator(".cr-field__error")).toHaveCount(0);
    await expect(form.locator(".cr-form__summary")).toHaveCount(0); // summary clears when valid
    const result = form.locator("pre").filter({ hasText: "submitted" });
    await expect(result).toContainText('"replicas": 4'); // number, not "4"
    await expect(result).toContainText('"cpu": 2'); // nested group, coerced to number
    await expect(result).toContainText('"owner": "ada"'); // autocomplete stores the VALUE, not the label
    await expect(result).toContainText('"region": "eu-west"');

    // an invalid value re-fails on change once the field has been touched
    await form.locator("#cr-form-endpoint").fill("nope");
    await expect(form.locator("#cr-form-endpoint-err")).toBeVisible();

    // switch the schema source (ArkType → JSON Schema) — the values persist, so
    // the JSON-Schema-sourced validator still flags the bad endpoint ("nope").
    await form.locator(".pg__controls select").first().selectOption("jsonschema");
    await expect(form.locator(".cr-form__row").first()).toBeVisible();
    await form.locator('button[type="submit"]').click();
    await expect(form.locator("#cr-form-endpoint-err")).toBeVisible();
  });

  test("conditional field shows/hides and is pruned from validation", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const form = page.locator('[data-island="form"]');
    const notify = form.locator(".cr-check input[type=checkbox]").first();

    await expect(form.locator("#cr-form-contact")).toHaveCount(0); // hidden when notify is off
    await notify.check();
    await expect(form.locator("#cr-form-contact")).toHaveCount(1); // conditional field appears
    await form.locator("#cr-form-contact").fill("nope");
    await form.locator('button[type="submit"]').click();
    await expect(form.locator("#cr-form-contact-err")).toBeVisible(); // validated while visible
    await notify.uncheck();
    await expect(form.locator("#cr-form-contact")).toHaveCount(0); // hidden → pruned, no lingering error
  });

  test("validation modes + dirty/reset", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const form = page.locator('[data-island="form"]');
    const reset = form.locator('button[type="button"]', { hasText: "Reset" });
    const endpoint = form.locator("#cr-form-endpoint");

    // default mode is "blur": typing an invalid value into a pristine field does
    // NOT error yet — the field validates first on blur.
    await expect(reset).toHaveCount(0); // pristine → no Reset button
    await endpoint.fill("nope");
    await expect(form.locator("#cr-form-endpoint-err")).toHaveCount(0); // not touched yet
    await endpoint.blur();
    await expect(form.locator("#cr-form-endpoint-err")).toBeVisible(); // blur → first validation

    // now dirty → a Reset button appears; clicking it restores the seed values
    // and clears every error/summary.
    await expect(reset).toBeVisible();
    await reset.click();
    await expect(endpoint).toHaveValue("");
    await expect(form.locator("#cr-form-endpoint-err")).toHaveCount(0);
    await expect(form.locator(".cr-form__summary")).toHaveCount(0);
    await expect(reset).toHaveCount(0); // pristine again
  });

  test("editing a control prop re-renders the live component", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const seg = page.locator('[data-island="segmented"]');

    // change the `value` enum control in the panel → the live segmented updates
    await seg.locator(".pg__controls select").selectOption("24h");
    await expect(seg.locator('.pg__live [aria-checked="true"]')).toHaveText("24h");

    // toggle the slider's `disabled` boolean control → the live input disables
    const slider = page.locator('[data-island="slider"]');
    await slider.locator('.pg__controls input[type="checkbox"]').check();
    await expect(slider.locator('.pg__live input[type="range"]')).toBeDisabled();

    // the code snippet reflects the current props
    await expect(slider.locator(".pg__code")).toContainText("disabled");
  });

  test("an external brand (slate) reskins the whole browser from one theme file", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const groundOf = () => page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--ground").trim());
    const accentOf = () => page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--sig-accent").trim());

    // default (dark) brand values
    expect(await groundOf()).toBe("#0f0327");
    expect(await accentOf()).toBe("#ff1a9d");

    // switch to the slate BRAND — an appearance file that lives outside the
    // built-in bundle (brands/slate.json). The roles flip; no component reloads.
    await page.locator('.switch button[data-set="slate"]').click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "slate");
    expect(await groundOf()).toBe("#0e1116"); // slate's surface
    expect(await accentOf()).toBe("#6d7cff"); // slate's accent — proves the reskin

    // components are still the same live React islands, just re-themed
    await expect(page.locator("[data-island]:not([data-island-ready])")).toHaveCount(0);
  });

  test("data grid virtualizes, sorts, and selects", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const grid = page.locator('[data-island="datagrid"]');
    const rows = grid.locator(".cr-grid__row");

    // virtualization: 2000 rows in the data, only a small window in the DOM
    const rendered = await rows.count();
    expect(rendered, "windowed row count").toBeGreaterThan(5);
    expect(rendered, "far fewer than the 2000-row dataset").toBeLessThan(60);

    // sort by ID descending (first sortable header: click twice → desc)
    const idHeader = grid.locator('[role="columnheader"] .cr-grid__sort').first();
    await idHeader.click(); // asc
    await idHeader.click(); // desc
    const firstIdDesc = await rows.first().locator(".cr-grid__cell").nth(1).innerText();
    expect(Number(firstIdDesc), "top row is the max id after desc sort").toBe(2000);

    // scroll the viewport → the windowed rows change (virtualization live)
    const firstBefore = await rows.first().getAttribute("aria-rowindex");
    await grid.locator(".cr-grid__viewport").evaluate((el) => (el.scrollTop = 4000));
    await page.waitForTimeout(60);
    const firstAfter = await rows.first().getAttribute("aria-rowindex");
    expect(firstAfter, "window shifted on scroll").not.toBe(firstBefore);

    // select-all via the header checkbox → selection count reflects the whole set
    await grid.locator('[role="columnheader"] input[type="checkbox"]').check();
    await expect(grid.locator(".pg__note").last()).toContainText("2000 selected");
  });

  test("data grid keyboard navigation (arrow keys move an active cell)", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const grid = page.locator('[data-island="datagrid"] .cr-grid');

    await grid.focus();
    const active = () => grid.getAttribute("aria-activedescendant");
    const first = await active();
    expect(first, "focusing the grid activates a cell").toBeTruthy();

    // arrow right/down move the active descendant, and the active cell gets the ring
    await grid.press("ArrowRight");
    await grid.press("ArrowDown");
    const moved = await active();
    expect(moved, "active cell changed after arrows").not.toBe(first);
    await expect(page.locator("#" + moved)).toHaveClass(/cr-grid__cell--active/);

    // PageDown jumps deep into the set — and virtualization scrolls it into view
    await grid.press("PageDown");
    await grid.press("PageDown");
    const deep = await active();
    const deepRow = Number(deep.split("-c-")[1].split("-")[0]);
    expect(deepRow, "paged past the first window").toBeGreaterThan(10);
    await expect(page.locator("#" + deep)).toBeVisible(); // scrolled into the rendered window
  });

  test("popover is collision-positioned and stays within the viewport", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const pop = page.locator('[data-island="popover"]');
    await pop.locator("[aria-haspopup]").click();
    const panel = pop.locator(".cr-popover__panel");
    await expect(panel).toBeVisible();

    // the placer ran: fixed position + a resolved placement
    await expect(panel).toHaveAttribute("data-placement", /^(top|bottom)-(start|end)$/);
    expect(await panel.evaluate((el) => getComputedStyle(el).position)).toBe("fixed");

    // and it doesn't clip off the viewport edges
    const box = await panel.boundingBox();
    const vp = page.viewportSize();
    expect(box.x, "left edge in view").toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width, "right edge in view").toBeLessThanOrEqual(vp.width + 1);
    expect(box.y, "top edge in view").toBeGreaterThanOrEqual(-1);
  });

  test("keyboard focus shows a visible ring", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    // Tab into the page (keyboard focus → :focus-visible applies) and confirm the
    // tokenized global focus ring actually renders on the focused control.
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(() => {
      const el = document.activeElement;
      const s = getComputedStyle(el);
      return { tag: el && el.tagName, style: s.outlineStyle, width: parseFloat(s.outlineWidth) || 0 };
    });
    expect(ring.tag, "something is focused").toBeTruthy();
    expect(ring.style, "outline style").not.toBe("none");
    expect(ring.width, "outline width > 0").toBeGreaterThan(0);
  });

  test("calm intensity profile dials motion + decoration down", async ({ page }) => {
    await page.goto(SHOWCASE);
    const def = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return cs.getPropertyValue("--motion-intensity").trim();
    });
    expect(def, "default is the loud showcase profile").toBe("1");
    const calm = await page.evaluate(() => {
      document.documentElement.setAttribute("data-intensity", "calm");
      const cs = getComputedStyle(document.documentElement);
      return {
        motion: cs.getPropertyValue("--motion-intensity").trim(),
        decor: cs.getPropertyValue("--decoration-intensity").trim(),
      };
    });
    expect(calm.motion, "calm kills non-essential motion").toBe("0");
    expect(calm.decor, "calm tones decoration down").toBe("0.4");
  });
});
