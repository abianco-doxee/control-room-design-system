// The Component Browser's live islands are the REAL compiled React components
// (dist/frameworks/react), mounted client-side. This gate proves they actually
// mount, error-free, and stay interactive — so the browser can't silently
// regress to dead markup.

import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

const SHOWCASE = pathToFileURL(join(process.cwd(), "public", "components.html")).href;

test.describe("component browser — live islands", () => {
  test("every island mounts the real component with no errors", async ({ page }) => {
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));

    // registry (DEMOS keys) and the mount points the generator emitted must match —
    // this is the drift guard between build-showcase.mjs's ISLAND_IDS and the entry.
    const registry = await page.evaluate(() => window.__CR_ISLANDS__.slice().sort());
    const mounts = await page.$$eval("[data-island]", (els) =>
      els.map((e) => e.getAttribute("data-island")).sort()
    );
    expect(mounts).toEqual(registry);
    expect(mounts.length).toBeGreaterThanOrEqual(22);

    // each mount hydrated (ready flag set, no error flag)
    await expect(page.locator("[data-island]:not([data-island-ready])")).toHaveCount(0);
    const failed = await page.$$eval("[data-island][data-island-error]", (els) =>
      els.map((e) => `${e.getAttribute("data-island")}: ${e.getAttribute("data-island-error")}`)
    );
    expect(failed, failed.join(", ") || "none").toEqual([]);

    expect(errors, errors.join("\n") || "none").toEqual([]);
  });

  test("islands are interactive, not static markup", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const scope = (id) => page.locator(`[data-island="${id}"]`);

    // tabs: selecting a tab updates the controlled panel + aria-selected
    const tabs = scope("tabs");
    const tab3 = tabs.getByRole("tab").nth(2);
    await tab3.click();
    await expect(tab3).toHaveAttribute("aria-selected", "true");
    // WAI-ARIA tab↔panel association: the active tab points at a tabpanel that
    // points back at it, and only the active panel is shown.
    const panelId = await tab3.getAttribute("aria-controls");
    const tabId = await tab3.getAttribute("id");
    expect(panelId).toBeTruthy();
    const panel = tabs.locator(`#${panelId}`);
    await expect(panel).toHaveAttribute("role", "tabpanel");
    await expect(panel).toHaveAttribute("aria-labelledby", tabId || "");
    await expect(panel).toContainText("panel 3");
    await expect(panel).toBeVisible();

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

  test("a11y: tooltip & hover-card are dismissable with Escape (WCAG 1.4.13)", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const scope = (id) => page.locator(`[data-island="${id}"]`);

    // tooltip: focus reveals the bubble; Escape hides it without moving focus;
    // leaving + re-entering focus shows it again (latch resets).
    const tip = scope("tooltip");
    const tipTrigger = tip.locator(".cr-tooltip__trigger button");
    const bubble = tip.locator(".cr-tooltip__bubble");
    await tipTrigger.focus();
    await expect(bubble).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(bubble).toBeHidden();
    await expect(tipTrigger).toBeFocused(); // focus not moved by the dismiss
    await tipTrigger.blur();
    await tipTrigger.focus();
    await expect(bubble).toBeVisible(); // latch reset on re-focus

    // hover-card: same contract for structured content.
    const hc = scope("hover-card");
    const hcTrigger = hc.locator(".cr-hovercard__trigger");
    const panel = hc.locator(".cr-hovercard__panel");
    await hcTrigger.focus();
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  });

  test("a11y: menu supports typeahead (type-to-focus an item)", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const menu = page.locator('[data-island="menu"]');

    // open with ArrowDown (opens + focuses the first item), then type to jump
    await menu.getByRole("button").first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("menuitem").first()).toBeFocused();
    await page.keyboard.press("d"); // items: Rename, Duplicate, Delete
    await expect(menu.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
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
    // Scoped to .pg__live (the real rendered CrForm) — the harness itself now
    // renders an unrelated always-present "reset" control in .pg__panel, and
    // Playwright's hasText match is case-insensitive, so an unscoped locator
    // would pick up both buttons.
    const reset = form.locator(".pg__live").locator('button[type="button"]', { hasText: "Reset" });
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

  test("per-field re-render isolation: typing one field doesn't re-render its siblings", async ({
    page,
  }) => {
    // CrForm delegates input to listeners on the <form> and renders each row as a
    // React.memo'd CrFormRow taking only data props — so a keystroke re-renders
    // only the edited field, not the whole form. CrFormRow ticks a per-path counter
    // on every React commit (a memoized bail-out doesn't commit → doesn't tick),
    // which is exactly what this asserts. See references/forms.md + CrFormRow.lite.tsx.
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const form = page.locator('[data-island="form"]');
    await expect(form.locator("#cr-form-name")).toBeVisible();

    // arm the probe AFTER mount (initial mounts, with the global unset, don't count)
    await page.evaluate(() => {
      window.__CR_ROW_RENDERS__ = {};
    });

    // type into `name` only
    await form.locator("#cr-form-name").pressSequentially("nova", { delay: 15 });
    await page.waitForTimeout(50); // let effects flush

    const renders = await page.evaluate(() => window.__CR_ROW_RENDERS__);
    // the edited field re-rendered…
    expect(renders["name"] || 0).toBeGreaterThanOrEqual(1);
    // …and NO other field did. A non-isolated form (single component, no memo)
    // would tick every visible row on each of the four keystrokes.
    const ticked = Object.keys(renders)
      .filter((k) => renders[k] > 0)
      .sort();
    expect(ticked, `only "name" should have re-rendered; got: ${JSON.stringify(renders)}`).toEqual([
      "name",
    ]);
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

  test("an external brand (slate) reskins the whole browser from one theme file", async ({
    page,
  }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const groundOf = () =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--ground").trim()
      );
    const accentOf = () =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--sig-accent").trim()
      );

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

  test("data grid supports variable-height rows (still virtualized)", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const island = page.locator('[data-island="datagrid"]');
    const rows = island.locator(".cr-grid__row");

    // turn on variable rows via the playground control
    await island.locator('.pg__controls input[type="checkbox"]').last().check();
    await page.waitForTimeout(60);

    // rows now have differing heights (prefix-sum layout), and it's still windowed
    const heights = await rows.evaluateAll((els) =>
      els.slice(0, 12).map((e) => Math.round(e.getBoundingClientRect().height))
    );
    expect(new Set(heights).size, `varied row heights: ${heights.join(",")}`).toBeGreaterThan(1);
    expect(await rows.count(), "still virtualized, not all 2000").toBeLessThan(60);
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

  test("line chart draws a numbered nice-scale y-axis (toggle-able)", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const island = page.locator('[data-island="line-chart"]');
    const yticks = island.locator(".cr-chart__ytick");

    // a numbered y-axis is present by default, with numeric labels
    const n = await yticks.count();
    expect(n, "y-axis has multiple nice ticks").toBeGreaterThan(1);
    const labels = await yticks.allTextContents();
    for (const t of labels) expect(t.trim(), `numeric tick "${t}"`).toMatch(/^-?[\d.]+[kM]?$/);

    // the "axis" playground toggle removes the numbered axis entirely
    await island.locator('.pg__controls input[type="checkbox"]').nth(1).uncheck();
    await page.waitForTimeout(40);
    expect(await yticks.count(), "axis toggled off").toBe(0);
  });

  test("line chart legend isolates and restores a series on click", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const island = page.locator('[data-island="line-chart"]');
    const keys = island.locator(".cr-chart__legend .cr-chart__key");
    await expect(keys, "one interactive key per series").toHaveCount(2);

    const visible = () =>
      island
        .locator(".cr-linechart__line")
        .evaluateAll((els) => els.filter((e) => e.closest("g").style.display !== "none").length);
    expect(await visible(), "both series drawn at rest").toBe(2);

    // click the first legend key → its series is hidden and the key reads muted
    await keys.first().click();
    await page.waitForTimeout(40);
    await expect(keys.first()).toHaveClass(/cr-chart__key--off/);
    await expect(keys.first()).toHaveAttribute("aria-pressed", "false");
    expect(await visible(), "one series hidden after toggle").toBe(1);

    // click again → restored
    await keys.first().click();
    await page.waitForTimeout(40);
    await expect(keys.first()).toHaveAttribute("aria-pressed", "true");
    expect(await visible(), "series restored").toBe(2);
  });

  // Select the playground <select> that owns a given option value (reorder-proof).
  const pick = (island, optionValue) =>
    island.locator(`.pg__controls select:has(option[value="${optionValue}"])`);

  test("line chart clock axis labels ticks as clock times", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const island = page.locator('[data-island="line-chart"]');

    await pick(island, "clock").selectOption("clock");
    await page.waitForTimeout(40);

    const labels = await island.locator(".cr-chart__tick").allTextContents();
    const clocks = labels.filter((t) => /^\d{2}:\d{2}(:\d{2})?$/.test(t.trim()));
    expect(clocks.length, `clock-formatted x-ticks: ${labels.join("|")}`).toBeGreaterThan(1);
    // continuous mode draws vertical gridlines at the ticks
    expect(
      await island.locator(".cr-chart__grid--v").count(),
      "vertical gridlines"
    ).toBeGreaterThan(0);
  });

  test("line chart calendar axis labels multi-month ticks with month names", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const island = page.locator('[data-island="line-chart"]');

    // default span is 5 months → monthly ticks
    await pick(island, "calendar").selectOption("calendar");
    await page.waitForTimeout(40);

    const labels = (await island.locator(".cr-chart__tick").allTextContents()).map((t) => t.trim());
    const months = labels.filter((t) => /^[A-Z][a-z]{2}( '\d\d)?$/.test(t));
    expect(months.length, `month-name ticks: ${labels.join("|")}`).toBeGreaterThan(2);
    // the tooltip stamp reads a calendar date+time on hover
    await island.locator(".cr-linechart__plot").hover();
    await expect(island.locator(".cr-chart__tip-x")).toBeVisible();
  });

  test("line chart calendar axis localises tick labels (Italian)", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const island = page.locator('[data-island="line-chart"]');

    await pick(island, "calendar").selectOption("calendar");
    await pick(island, "it").selectOption("it");
    await page.waitForTimeout(40);

    const labels = (await island.locator(".cr-chart__tick").allTextContents()).map((t) => t.trim());
    const itMonths = [
      "gen",
      "feb",
      "mar",
      "apr",
      "mag",
      "giu",
      "lug",
      "ago",
      "set",
      "ott",
      "nov",
      "dic",
    ];
    const hit = labels.filter((t) => itMonths.includes(t.replace(/ '\d\d/, "")));
    expect(hit.length, `italian month ticks: ${labels.join("|")}`).toBeGreaterThan(2);
  });

  test("line chart log y-scale ticks span decades on powers of ten", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const island = page.locator('[data-island="line-chart"]');

    await pick(island, "log").selectOption("log");
    await page.waitForTimeout(40);

    const labels = (await island.locator(".cr-chart__ytick").allTextContents()).map((t) =>
      t.trim()
    );
    // wide-range series → the axis should reach from tens to thousands
    expect(
      labels.some((t) => /^\d+$/.test(t) && Number(t) <= 10),
      `low decade: ${labels.join("|")}`
    ).toBeTruthy();
    expect(
      labels.some((t) => /k$/.test(t)),
      `high decade (k): ${labels.join("|")}`
    ).toBeTruthy();
    expect(labels.length, "several log ticks").toBeGreaterThan(2);
  });

  test("line chart market axis collapses idle gaps with break markers", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const island = page.locator('[data-island="line-chart"]');

    await pick(island, "market").selectOption("market");
    await page.waitForTimeout(40);

    // overnight + weekend gaps are collapsed → dashed break markers appear
    expect(
      await island.locator(".cr-chart__break").count(),
      "collapsed-gap markers"
    ).toBeGreaterThan(1);
    // one tick per session day (Thu/Fri/Mon → 3), not a tick per hour
    const dayTicks = (await island.locator(".cr-chart__tick").allTextContents())
      .map((t) => t.trim())
      .filter(Boolean);
    expect(dayTicks.length, `day ticks: ${dayTicks.join("|")}`).toBeLessThanOrEqual(4);
  });

  test("line chart xFormat escape hatch overrides tick labels", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const island = page.locator('[data-island="line-chart"]');

    await pick(island, "calendar").selectOption("calendar");
    // customLabels is the only checkbox after area+axis; toggle it on
    await island.locator('.pg__controls input[type="checkbox"]').last().check();
    await page.waitForTimeout(40);

    const labels = (await island.locator(".cr-chart__tick").allTextContents()).map((t) => t.trim());
    const dmy = labels.filter((t) => /^\d{2}\/\d{2}$/.test(t));
    expect(dmy.length, `custom DD/MM ticks: ${labels.join("|")}`).toBeGreaterThan(2);
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

  test("menu is collision-positioned and stays within the viewport", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const menu = page.locator('[data-island="menu"]');
    await menu.locator("[aria-haspopup]").click();
    const panel = menu.locator(".cr-menu__panel");
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

  test("hover-card is collision-positioned on both hover and keyboard focus", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const hc = page.locator('[data-island="hover-card"]');
    const trigger = hc.locator(".cr-hovercard__trigger");
    const panel = hc.locator(".cr-hovercard__panel");

    // pointer path: hovering the trigger reveals the panel (CSS :hover) and the
    // placer must have run before/alongside that reveal.
    await trigger.hover();
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute("data-placement", /^(top|bottom)-(start|end)$/);
    expect(await panel.evaluate((el) => getComputedStyle(el).position)).toBe("fixed");

    // reset the CSS reveal (:hover/:focus-within) between paths
    await page.mouse.move(0, 0);
    await expect(panel).toBeHidden();

    // keyboard path: focusing the trigger reveals the panel (CSS :focus-within)
    // via the same placer call.
    await trigger.focus();
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute("data-placement", /^(top|bottom)-(start|end)$/);
    expect(await panel.evaluate((el) => getComputedStyle(el).position)).toBe("fixed");

    // and it doesn't clip off the viewport edges
    const box = await panel.boundingBox();
    const vp = page.viewportSize();
    expect(box.x, "left edge in view").toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width, "right edge in view").toBeLessThanOrEqual(vp.width + 1);
    expect(box.y, "top edge in view").toBeGreaterThanOrEqual(-1);

    // reset before the third path
    await trigger.blur();
    await page.mouse.move(0, 0);
    await expect(panel).toBeHidden();

    // third reveal path: the panel has no focusable content in this playground
    // demo (its children are a plain <p>), so a focusable child is injected for
    // this assertion only — it is what components.md warns hover-card content
    // normally shouldn't need, but the component must still cope with it. Hover
    // to reveal (CSS :hover, which also runs place() via mouseenter), Tab from
    // the trigger into that child (staying within the subtree keeps
    // :focus-within true), then move the pointer away so only :focus-within
    // holds the card open — the transition that had no place() call on it
    // before onFocus moved from the trigger to the root.
    await panel.evaluate((el) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "inner";
      btn.className = "cr-hovercard-test-inner";
      el.appendChild(btn);
    });
    await trigger.hover();
    await expect(panel).toBeVisible();
    await page.keyboard.press("Tab"); // trigger -> inner button, still inside the card
    await expect(panel.locator(".cr-hovercard-test-inner")).toBeFocused();
    await page.mouse.move(0, 0); // pointer leaves; only :focus-within holds it open now
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute("data-placement", /^(top|bottom)-(start|end)$/);
    expect(await panel.evaluate((el) => getComputedStyle(el).position)).toBe("fixed");
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
      return {
        tag: el && el.tagName,
        style: s.outlineStyle,
        width: parseFloat(s.outlineWidth) || 0,
      };
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

  test("stepper marks the current step and navigates on click", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const stepper = page.locator('[data-island="stepper"]');
    await expect(stepper.locator('[aria-current="step"]')).toContainText("Limits"); // active=1 default
    await stepper.getByRole("button").first().click(); // → Source
    await expect(stepper.locator('[aria-current="step"]')).toContainText("Source");
  });

  test("pin-input: typing fills cells and advances focus", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const cells = page.locator('[data-island="pin-input"] .cr-pin__cell');
    await cells.first().click();
    await page.keyboard.type("123456");
    await expect(cells.nth(0)).toHaveValue("1");
    await expect(cells.nth(5)).toHaveValue("6");
    await expect(cells.nth(5)).toBeFocused(); // focus advanced to the last cell
  });

  test("tags-input: add with Enter, remove via the labelled button", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const tags = page.locator('[data-island="tags-input"]');
    const input = tags.locator(".cr-tags__input");
    await input.fill("prod");
    await input.press("Enter");
    await expect(tags.getByText("prod", { exact: true })).toBeVisible();
    await tags.getByRole("button", { name: "Remove eu-west" }).click(); // seeded tag
    await expect(tags.getByText("eu-west", { exact: true })).toHaveCount(0);
  });

  test("a11y: avatar and spinner expose their roles + accessible names", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    // avatar with no src → wrapper is role=img labelled by the name
    const avatarWrap = page.locator('[data-island="avatar"] .cr-avatar');
    await expect(avatarWrap).toHaveAttribute("role", "img");
    await expect(avatarWrap).toHaveAttribute("aria-label", /Ada/);
    // spinner announces via role=status + label
    const spinner = page.locator('[data-island="spinner"]').getByRole("status");
    await expect(spinner).toHaveAttribute("aria-label", /Provisioning/);
  });

  test("resizable: separator exposes its value and resizes with the keyboard", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const sep = page.locator('[data-island="resizable"]').getByRole("separator");
    await expect(sep).toHaveAttribute("aria-orientation", "vertical"); // horizontal split
    const before = Number(await sep.getAttribute("aria-valuenow"));
    await sep.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    const after = Number(await sep.getAttribute("aria-valuenow"));
    expect(after).toBeGreaterThan(before); // grew ~4% and stayed within clamps
    expect(after).toBeLessThanOrEqual(90);
  });

  test("scroll-area: a labelled region that actually scrolls", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const sa = page.locator('[data-island="scroll-area"] .cr-scroll');
    await expect(sa).toHaveAttribute("role", "group");
    await expect(sa).toHaveAttribute("aria-label", /Log output/);
    const overflows = await sa.evaluate((el) => el.scrollHeight > el.clientHeight + 1);
    expect(overflows, "content exceeds the capped height → scrolls").toBe(true);
  });
});
