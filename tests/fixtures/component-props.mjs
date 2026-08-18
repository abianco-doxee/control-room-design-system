// Render fixtures — one realistic prop set per component.
//
// The runtime gates used to render a hand-picked list of ~10 components: the ones
// that happen to need no props. That is why CrCalendar could throw on every Solid
// render and CrLineChart on every Svelte render without a single test going red —
// nothing ever rendered them. Compiling proves a component parses; only rendering
// proves it runs.
//
// Props come from each component's own `export interface Cr<Name>Props`: every
// REQUIRED field is supplied with a value of the declared shape, and optionals are
// added only where they unlock a meaningful branch (an `area` fill, a `sortable`
// column). Values are deliberately boring — the gate asserts a component RENDERS,
// not what it renders; the visual/a11y suites own appearance.
//
// A component missing from this map renders with `{}`, which is correct for the
// ~27 that declare no required props. The all-components gate fails on an
// unexpected throw either way, so a NEW component with required props announces
// itself the first time it runs.

/** Fixed instant so a clock-reading component renders deterministically. */
export const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);

export const PROPS = {
  // ── data display ──
  CrAccordion: {
    items: [
      { title: "One", body: "First" },
      { title: "Two", body: "Second" },
    ],
  },
  CrBarChart: {
    data: [
      { label: "a", value: 3 },
      { label: "b", value: 7, signal: "done" },
    ],
  },
  CrDataGrid: {
    columns: [
      { key: "a", label: "A" },
      { key: "b", label: "B", sortable: true },
    ],
    rows: [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ],
  },
  CrLineChart: {
    series: [
      { name: "s1", data: [1, 5, 3] },
      { name: "s2", data: [2, 2, 4], signal: "done" },
    ],
    labels: ["x", "y", "z"],
    area: true,
  },
  CrSparkline: { data: [1, 4, 2, 8], area: true },
  CrStackedBar: {
    segments: [
      { label: "done", value: 6, signal: "done" },
      { label: "work", value: 4, signal: "work" },
    ],
  },
  CrTable: {
    columns: ["A", "B"],
    rows: [
      ["1", "2"],
      ["3", "4"],
    ],
  },
  CrTiles: {
    tiles: [
      { label: "one", state: "work" },
      { label: "two", state: "done" },
    ],
  },
  CrTimeline: { items: [{ time: "12:00", title: "Started", signal: "work" }] },
  CrTree: { nodes: [{ id: "r", label: "root", children: [{ id: "c", label: "child" }] }] },

  // ── navigation ──
  CrArrowRail: { steps: ["one", "two", "three"] },
  CrBreadcrumb: { items: [{ label: "Home", href: "/" }, { label: "Here" }] },
  CrCarousel: { slides: [{ title: "One" }, { title: "Two" }], label: "Gallery" },
  CrMenu: { label: "Actions", items: [{ label: "Rename" }, { label: "Delete", danger: true }] },
  CrNav: {
    items: [
      { label: "Home", href: "/", active: true },
      { label: "Docs", href: "/d" },
    ],
  },
  CrPagination: { page: 2, total: 10 },
  CrSegmented: {
    options: [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ],
  },
  CrStepper: { steps: [{ label: "One" }, { label: "Two" }] },
  CrTabs: { tabs: ["One", "Two", "Three"] },
  CrToolbar: { label: "Tools" },

  // ── forms ──
  CrChoice: { label: "Enable" },
  CrChoiceGroup: {
    options: [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ],
  },
  CrCronField: { id: "cron", value: "0 * * * *" },
  CrField: { id: "f1", label: "Name" },
  CrFileUpload: { label: "Attach" },
  CrForm: {
    fields: [
      { name: "n", kind: "text", label: "Name", required: true },
      { name: "c", kind: "checkbox", label: "Live" },
    ],
  },
  // CrFormRow is an internal row renderer driven by CrForm's flattened model —
  // its five required props are that internal contract, not a public API.
  CrFormRow: {
    rowType: "field",
    field: { name: "n", kind: "text", label: "N" },
    pathKey: "n",
    cid: "f-n",
    padLeft: "0",
  },
  CrNumberField: { value: 3 },
  CrSelect: { options: ["one", "two"] },
  CrSlider: { value: 40 },

  // ── feedback / overlay ──
  CrEmptyState: { message: "Nothing here" },
  CrHoverCard: { label: "More" },
  CrPalette: {
    commands: [
      { id: "a", label: "Alpha" },
      { id: "b", label: "Beta" },
    ],
  },
  CrPopover: { label: "Open" },
  CrToastRegion: { toasts: [{ id: 1, message: "Saved", signal: "done" }] },
  CrTooltip: { id: "tip1" },

  // ── identity / chrome ──
  CrAvatar: { name: "Ada Lovelace" },
  CrDrip: { title: "Drip" },
  CrHero: { big: "42" },
  CrIcon: { name: "check" },
  CrKbd: { keys: "ctrl+k" },
  CrMasthead: { title: "Control Room" },
  CrOverflow: { count: 3, noun: "session" },
  CrSessionRow: { name: "worker-01", status: "work" },
  CrShape: { severity: "warn" },
  CrStatusDot: { label: "online" },
  CrToggleChip: { label: "Filter" },

  // ── seeded generative ──
  CrAscii: { seed: "seed-1" },
  CrCat: { seed: "seed-1", state: "working" },
  CrChrome: { seed: "seed-1" },
  CrDither: { seed: "seed-1" },
  CrSigil: { seed: "seed-1" },
  CrTelemetry: { seed: "seed-1" },

  // ── time (clock injected so SSR is deterministic) ──
  CrCalendar: { month: "2026-01", value: "2026-01-15" },
  CrRelativeTime: { time: NOW - 5 * 60000, now: NOW },

  // ── misc with useful optionals ──
  CrProgress: { value: 42 },
  CrKeyHints: { hints: [{ keys: "ctrl+k", label: "Palette" }] },
};

/** Props for `name`, or `{}` when it needs none. */
export const propsFor = (name) => PROPS[name] || {};
