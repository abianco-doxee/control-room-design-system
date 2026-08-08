/**
 * Live playgrounds for the Component Browser.
 *
 * Every entry mounts the ACTUAL compiled React component from
 * dist/frameworks/react (the shipped output) inside a Playground harness: a
 * typed controls panel edits the component's props and re-renders it live, and a
 * code snippet reflects the current props — the Doxee-hub playground model.
 *
 * Bundled by build/build-showcase.mjs (esbuild → inlined IIFE) and mounted into
 * each <div data-island="<catalog-id>"> the browser emits. A component with no
 * entry here falls back to its static state snippets — markup is never
 * hand-written for a live component, so it can't drift from the real thing.
 */
import * as React from "react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CrAccordion, CrTabs, CrMenu, CrCombobox, CrPalette, CrTree, CrDrawer,
  CrPopover, CrHoverCard, CrSegmented, CrRadioGroup, CrSlider, CrNumberField,
  CrPagination, CrDateTime, CrCronField, CrModal, CrSwitch, CrSelect,
  CrTooltip, CrTable, CrToastRegion,
  CrButton, CrChoice, CrField, CrInput, CrTextarea, CrBreadcrumb, CrToast,
  CrKbd, CrAlert, CrChip, CrEmptyState, CrMeter, CrProgress, CrStatusDot,
  CrTag, CrSessionRow, CrPanel, CrIcon,
  CrSparkline, CrLineChart, CrBarChart, CrStackedBar, CrForm, CrDataGrid,
} from "../dist/frameworks/react/index.ts";
import { defineForm, type as ark } from "../lib/forms/index.js";

// A big, deterministic dataset to exercise the data grid's virtualization.
const GRID_REGIONS = ["eu-west", "us-east", "ap-south", "sa-east"];
const GRID_STATES = ["working", "waiting", "done", "error", "idle"];
const GRID_ROWS = Array.from({ length: 2000 }, (_, i) => ({
  id: i + 1,
  host: "node-" + String(1000 + i),
  region: GRID_REGIONS[i % GRID_REGIONS.length],
  cpu: (i * 37) % 100,
  status: GRID_STATES[i % GRID_STATES.length],
}));
const GRID_COLS = [
  { key: "id", label: "ID", sortable: true, align: "end", width: "70px" },
  { key: "host", label: "Host", sortable: true, width: "1fr" },
  { key: "region", label: "Region", sortable: true, width: "110px" },
  { key: "cpu", label: "CPU %", sortable: true, align: "end", width: "90px" },
  { key: "status", label: "Status", sortable: true, width: "110px" },
];

const ICON_NAMES = ["play", "pause", "stop", "retry", "deploy", "scan", "search", "alert", "error", "done", "clock", "cpu", "logs", "filter", "sliders", "close", "chevron", "plus", "minus", "trash", "external", "copy", "session", "menu"];

const h = React.createElement;

// ── shared demo data (fixed, non-editable props) ───────────────────────────
const TABS = ["Overview", "Sessions", "Logs"];
const ACC_ITEMS = [
  { title: "Provisioning", body: "Workers spin up from the warm pool; cold starts fall back to on-demand." },
  { title: "Scheduling", body: "Sessions are placed by region affinity, then least-loaded worker." },
  { title: "Teardown", body: "Idle sessions park after 5m and are reaped after 30m." },
];
const MENU_ITEMS = [{ label: "Rename" }, { label: "Duplicate" }, { label: "Delete", danger: true }];
const OPTIONS = [
  { value: "eu-west", label: "eu-west-1" },
  { value: "us-east", label: "us-east-1" },
  { value: "ap-south", label: "ap-south-1" },
];
const COMMANDS = [
  { id: "deploy", label: "Deploy current build", hint: "⌘⏎", group: "Actions" },
  { id: "scan", label: "Run integrity scan", group: "Actions" },
  { id: "logs", label: "Open logs", hint: "L", group: "Navigate" },
  { id: "kill", label: "Kill session", group: "Danger" },
];
const TREE = [
  { id: "w1", label: "worker-01 · eu-west", children: [
    { id: "s1", label: "session 4f2a · scan" },
    { id: "s2", label: "session 9c1d · deploy" },
  ] },
  { id: "w2", label: "worker-02 · us-east", children: [{ id: "s3", label: "session 71be · idle" }] },
];
const SEG_OPTS = [{ value: "live", label: "Live" }, { value: "1h", label: "1h" }, { value: "24h", label: "24h" }];
const RADIO_OPTS = [
  { value: "packed", label: "Bin-packed" },
  { value: "balanced", label: "Balanced" },
  { value: "spread", label: "Spread" },
];
const CRON_PRESETS = [
  { label: "Hourly", cron: "0 * * * *" },
  { label: "Weekdays 9am", cron: "0 9 * * 1-5" },
  { label: "Nightly", cron: "0 0 * * *" },
];
const CRON_TEXT = {
  "0 * * * *": "At minute 0 of every hour.",
  "0 9 * * 1-5": "At 09:00 AM, Monday through Friday.",
  "0 0 * * *": "At 12:00 AM, every day.",
};
const describeCron = (c) => CRON_TEXT[(c || "").trim()] || "Custom schedule.";
const TABLE = {
  columns: ["Session", "Region", "State", "p95"],
  rows: [["4f2a", "eu-west", "work", "210ms"], ["9c1d", "us-east", "wait", "980ms"], ["71be", "ap-south", "idle", "—"]],
};

// ── controls harness ───────────────────────────────────────────────────────
// enum options may be strings or {value,label}
const normOpts = (opts) => opts.map((o) => (typeof o === "string" ? { value: o, label: o } : o));

function Field({ def, value, set }) {
  const label = def.label || def.prop;
  const onNum = (e) => set(def.prop, e.target.value === "" ? 0 : Number(e.target.value));
  // implicit label association (wrapping) — avoids id collisions across roots
  if (def.type === "boolean") {
    return h("label", { className: "pg__ctl pg__ctl--bool" },
      h("input", { type: "checkbox", checked: !!value, onChange: (e) => set(def.prop, e.target.checked) }),
      h("span", { className: "pg__ctl-name" }, label));
  }
  if (def.type === "number") {
    return h("label", { className: "pg__ctl" },
      h("span", { className: "pg__ctl-name" }, label),
      h("input", { type: "number", value, min: def.min, max: def.max, step: def.step, onChange: onNum }));
  }
  if (def.type === "enum") {
    return h("label", { className: "pg__ctl" },
      h("span", { className: "pg__ctl-name" }, label),
      h("select", { value, onChange: (e) => set(def.prop, e.target.value) },
        normOpts(def.options).map((o) => h("option", { key: o.value, value: o.value }, o.label))));
  }
  return h("label", { className: "pg__ctl" }, // text / children
    h("span", { className: "pg__ctl-name" }, label),
    h("input", { type: "text", value, onChange: (e) => set(def.prop, e.target.value) }));
}

function snippet(tag, defs, state) {
  const attrs = [];
  let kids = null;
  for (const d of defs) {
    if (d.type === "children") { kids = state[d.prop]; continue; }
    const v = state[d.prop];
    if (d.type === "boolean") { if (v) attrs.push(d.prop); }
    else if (d.type === "number") attrs.push(`${d.prop}={${v}}`);
    else if (v !== "" && v != null) attrs.push(`${d.prop}="${v}"`); // "" = omitted prop
  }
  const a = attrs.length ? " " + attrs.join(" ") : "";
  return kids != null ? `<${tag}${a}>${kids}</${tag}>` : `<${tag}${a} />`;
}

function Playground({ tag, defs, render, extra }) {
  const [state, setState] = useState(() => ({
    ...Object.fromEntries(defs.map((d) => [d.prop, d.default])),
    ...(extra || {}),
  }));
  const set = (k, v) => setState((s) => ({ ...s, [k]: v }));
  return h("div", { className: "pg" },
    h("div", { className: "pg__live" }, render(state, set)),
    h("div", { className: "pg__panel" },
      h("div", { className: "pg__controls" }, defs.map((d) => h(Field, { key: d.prop, def: d, value: state[d.prop], set }))),
      h("pre", { className: "pg__code" }, snippet(tag, defs, state))));
}

// chart demo data (fixed; the playground edits the scalar props, not the data)
const SPARK_DATA = [3, 5, 4, 7, 6, 9, 8, 12, 10, 14, 11, 15];
const LINE_SERIES = [
  { name: "throughput", data: [12, 18, 15, 22, 19, 26, 24, 31], signal: "work" },
  { name: "errors", data: [2, 3, 2, 5, 4, 3, 6, 4], signal: "err" },
];
const LINE_LABELS = ["09", "10", "11", "12", "13", "14", "15", "16"];
// Wide-range series (spans ~3 decades) to show off the log y-scale.
const LOG_SERIES = [{ name: "p99 latency", data: [8, 45, 220, 1800, 130, 12, 600, 5200], signal: "work" }];
// Epoch-ms x-values (15-min cadence from a fixed base) for the clock (sub-day) axis.
const LINE_X = (() => {
  const base = Date.UTC(2026, 0, 1, 9, 0, 0), step = 15 * 60 * 1000;
  return LINE_LABELS.map((_, i) => base + i * step);
})();
// Calendar-axis datasets at three spans, so each granularity (week / month /
// quarter) is demoable live. Deterministic (sine), values ~an error-budget %.
const DAY = 24 * 3600 * 1000;
const calSet = (start, stepMs, count) => {
  const x = [], data = [];
  for (let i = 0; i < count; i++) { x.push(start + i * stepMs); data.push(80 + Math.round(18 * Math.sin(i / 2.5)) + (i % 4)); }
  return { x, data };
};
const CAL_WK = calSet(Date.UTC(2026, 0, 5), DAY, 43);        // 6 weeks of daily → weekly ticks
const CAL_MO = calSet(Date.UTC(2025, 0, 6), 7 * DAY, 22);    // 5 months of weekly → monthly ticks
const CAL_YR = calSet(Date.UTC(2024, 3, 1), 30 * DAY, 13);   // ~1 year monthly → quarterly ticks
const BAR_DATA = [
  { label: "eu", value: 42 },
  { label: "us", value: 31 },
  { label: "ap", value: 18 },
  { label: "sa", value: 9 },
];
const STACK_SEGS = [
  { label: "working", value: 6, signal: "work" },
  { label: "waiting", value: 3, signal: "wait" },
  { label: "done", value: 9, signal: "done" },
  { label: "failed", value: 1, signal: "err" },
];

// Schema-driven form demo — one ArkType schema is the source of truth; the same
// form is also derived from its exported JSON Schema to prove the bridge runs
// both ways (identical model + validation, either source).
// A fake async data source (stands in for a remote lookup). Latest-wins ordering
// in CrForm means out-of-order responses can't clobber the list.
const OWNERS = [
  { value: "ada", label: "Ada Lovelace · ada@ops" },
  { value: "grace", label: "Grace Hopper · grace@ops" },
  { value: "alan", label: "Alan Turing · alan@ops" },
  { value: "katherine", label: "Katherine Johnson · kat@ops" },
  { value: "margaret", label: "Margaret Hamilton · mh@ops" },
];
const searchOwners = (q) =>
  new Promise((resolve) => {
    const query = (q || "").trim().toLowerCase();
    const hits = query ? OWNERS.filter((o) => o.label.toLowerCase().includes(query)) : OWNERS;
    setTimeout(() => resolve(hits), 140); // simulate network latency
  });

const SessionSchema = ark({
  name: "string >= 2",
  endpoint: "string.url",
  replicas: "1 <= number.integer <= 32",
  region: "'eu-west' | 'us-east' | 'ap-south'",
  owner: "string >= 2",
  notify: "boolean",
  "contact?": "string.email", // conditional — shown only when notify is on
  limits: { cpu: "1 <= number <= 64", memGB: "number > 0" }, // nested group
  "tags?": "string[]", // scalar array
  "hooks?": ark({ event: "'deploy' | 'scale' | 'error'", url: "string.url" }).array(), // object array
  "notes?": "string <= 140",
  autoscale: "boolean",
});
const FORM_OVERRIDES = {
  order: ["name", "endpoint", "replicas", "region", "owner", "notify", "contact", "limits", "tags", "hooks", "notes", "autoscale"],
  overrides: {
    name: { label: "Session name", hint: "lowercase, no spaces", placeholder: "nova-01" },
    endpoint: { label: "Endpoint URL", placeholder: "https://…" },
    replicas: { hint: "1–32 workers" },
    region: { label: "Region", kind: "autocomplete" }, // searchable enum (static source)
    owner: { label: "Owner", kind: "autocomplete", source: searchOwners, placeholder: "search people…", hint: "async source" },
    notify: { label: "Notify on state change" },
    contact: { label: "Contact email", when: (v) => v.notify === true, hint: "conditional — shown when notify is on" },
    limits: { label: "Resource limits" },
    "limits.cpu": { label: "vCPU", hint: "1–64" },
    "limits.memGB": { label: "Memory (GB)" },
    tags: { label: "Tags", itemLabel: "tag" },
    hooks: { label: "Webhooks", itemLabel: "hook" },
    "hooks.event": { label: "Event" },
    "hooks.url": { label: "URL", placeholder: "https://…" },
    notes: { kind: "textarea", hint: "optional · ≤140 chars" },
    autoscale: { label: "Auto-scale on demand" },
  },
};
const FORM_ARK = defineForm(SessionSchema, FORM_OVERRIDES);
const FORM_JSON = defineForm(FORM_ARK.jsonSchema, FORM_OVERRIDES);

// ── per-component playgrounds (keyed by catalog id) ─────────────────────────
const T = (type, prop, def, more) => ({ type, prop, default: def, ...(more || {}) });

const DEMOS = {
  accordion: {
    tag: "CrAccordion", defs: [T("boolean", "single", true)],
    render: (s) => h(CrAccordion, { items: ACC_ITEMS, single: s.single, defaultOpen: [0] }),
  },
  tabs: {
    tag: "CrTabs", defs: [T("number", "active", 0, { min: 0, max: 2 })],
    render: (s, set) => h("div", null,
      h(CrTabs, { tabs: TABS, active: s.active, onChange: (i) => set("active", i) }),
      h("p", { className: "pg__note" }, `panel ${s.active + 1} selected`)),
  },
  menu: {
    tag: "CrMenu",
    defs: [T("text", "label", "Actions"), T("enum", "align", "left", { options: ["left", "right"] })],
    render: (s) => h(CrMenu, { label: s.label, align: s.align, items: MENU_ITEMS }),
  },
  combobox: {
    tag: "CrCombobox",
    defs: [T("boolean", "async", false), T("text", "placeholder", "Search regions…"), T("text", "label", "Region")],
    render: (s) =>
      s.async
        ? h(CrCombobox, { source: searchOwners, label: "Owner", placeholder: "search people…", onChange: () => {} })
        : h(CrCombobox, { options: OPTIONS, label: s.label, placeholder: s.placeholder, onChange: () => {} }),
  },
  palette: {
    tag: "CrPalette",
    defs: [T("boolean", "open", false), T("text", "placeholder", "Type a command…")],
    render: (s, set) => h(CrPalette, { open: s.open, commands: COMMANDS, placeholder: s.placeholder, onRun: () => set("open", false), onClose: () => set("open", false) }),
  },
  tree: {
    tag: "CrTree", defs: [T("text", "label", "Fleet")],
    render: (s) => h(CrTree, { nodes: TREE, label: s.label, defaultExpanded: ["w1"] }),
  },
  drawer: {
    tag: "CrDrawer",
    defs: [T("boolean", "open", false), T("enum", "side", "right", { options: ["left", "right"] }), T("text", "title", "Session inspector")],
    render: (s, set) => h(CrDrawer, { open: s.open, side: s.side, title: s.title, onClose: () => set("open", false) },
      h("p", { style: { color: "var(--muted)" } }, "Live drawer content. Esc or the backdrop closes it.")),
  },
  popover: {
    tag: "CrPopover",
    defs: [T("text", "label", "Details"), T("text", "title", "Worker health"), T("enum", "align", "left", { options: ["left", "right"] })],
    render: (s) => h(CrPopover, { label: s.label, title: s.title, align: s.align },
      h("p", { style: { color: "var(--muted)", margin: 0 } }, "CPU 41% · mem 3.2/8GB · 2 sessions")),
  },
  "hover-card": {
    tag: "CrHoverCard",
    defs: [T("text", "label", "eu-west-01"), T("text", "title", "Region status"), T("enum", "align", "left", { options: ["left", "right"] })],
    render: (s) => h(CrHoverCard, { label: s.label, title: s.title, align: s.align },
      h("p", { style: { color: "var(--muted)", margin: 0 } }, "12 workers · 41 sessions · p95 210ms")),
  },
  segmented: {
    tag: "CrSegmented",
    defs: [T("enum", "value", "live", { options: SEG_OPTS }), T("text", "label", "View")],
    render: (s, set) => h(CrSegmented, { options: SEG_OPTS, value: s.value, label: s.label, onChange: (v) => set("value", v) }),
  },
  "radio-group": {
    tag: "CrRadioGroup",
    defs: [T("enum", "value", "balanced", { options: RADIO_OPTS }), T("boolean", "row", false), T("text", "label", "Placement")],
    render: (s, set) => h(CrRadioGroup, { options: RADIO_OPTS, value: s.value, row: s.row, label: s.label, onChange: (v) => set("value", v) }),
  },
  slider: {
    tag: "CrSlider",
    defs: [T("number", "value", 60, { min: 0, max: 100 }), T("number", "min", 0), T("number", "max", 100), T("number", "step", 5), T("boolean", "disabled", false)],
    render: (s, set) => h(CrSlider, { ...s, label: `Throttle · ${s.value}%`, onChange: (v) => set("value", v) }),
  },
  "number-field": {
    tag: "CrNumberField",
    defs: [T("number", "value", 4, { min: 1, max: 32 }), T("number", "min", 1), T("number", "max", 32), T("number", "step", 1), T("boolean", "disabled", false)],
    render: (s, set) => h(CrNumberField, { ...s, label: "Replicas", onChange: (v) => set("value", v) }),
  },
  pagination: {
    tag: "CrPagination",
    defs: [T("number", "page", 3, { min: 1, max: 9 }), T("number", "total", 9, { min: 1, max: 20 })],
    render: (s, set) => h(CrPagination, { page: s.page, total: s.total, onChange: (p) => set("page", p) }),
  },
  datetime: {
    tag: "CrDateTime",
    defs: [T("enum", "kind", "datetime-local", { options: ["datetime-local", "date", "time"] }), T("text", "value", "2026-08-04T09:00"), T("text", "label", "First run"), T("boolean", "disabled", false)],
    render: (s, set) => h(CrDateTime, { value: s.value, kind: s.kind, label: s.label, disabled: s.disabled, onChange: (v) => set("value", v) }),
  },
  "cron-field": {
    tag: "CrCronField",
    defs: [T("text", "value", "0 9 * * 1-5"), T("text", "label", "Schedule"), T("text", "error", "")],
    render: (s, set) => h(CrCronField, { id: "cr-cron-demo", value: s.value, presets: CRON_PRESETS, description: s.error ? undefined : describeCron(s.value), error: s.error || undefined, label: s.label, onChange: (v) => set("value", v) }),
  },
  modal: {
    tag: "CrModal",
    defs: [T("boolean", "open", false), T("text", "title", "Confirm teardown")],
    render: (s, set) => h(CrModal, { open: s.open, title: s.title, onClose: () => set("open", false) },
      h("p", { style: { color: "var(--muted)" } }, "This reaps 3 idle sessions. Esc or the backdrop closes it.")),
  },
  switch: {
    tag: "CrSwitch",
    defs: [T("boolean", "checked", true), T("boolean", "disabled", false)],
    render: (s, set) => h(CrSwitch, { checked: s.checked, disabled: s.disabled, label: s.checked ? "Auto-scale on" : "Auto-scale off", onChange: (v) => set("checked", v) }),
  },
  select: {
    tag: "CrSelect",
    defs: [T("text", "label", "Region"), T("boolean", "disabled", false)],
    render: (s) => h(CrSelect, { label: s.label, options: ["eu-west-1", "us-east-1", "ap-south-1"], disabled: s.disabled }),
  },
  tooltip: {
    tag: "CrTooltip", defs: [T("text", "label", "Reaps sessions idle > 30m")],
    render: (s) => h(CrTooltip, { label: s.label }, h("button", { className: "cr-btn cr-btn--sm" }, "Hover me")),
  },
  table: {
    tag: "CrTable",
    defs: [T("boolean", "sortable", true), T("boolean", "selectable", true), T("boolean", "sticky", false)],
    render: (s) => h(CrTable, { columns: TABLE.columns, rows: TABLE.rows, sortable: s.sortable, selectable: s.selectable, sticky: s.sticky }),
  },
  "toast-region": {
    tag: "CrToastRegion",
    defs: [T("enum", "position", "br", { options: ["tr", "br", "tl", "bl"] })],
    extra: { toasts: [{ id: 1, signal: "done", message: "Deploy complete" }, { id: 2, signal: "work", message: "Scanning 3 workers…" }] },
    // `transform` makes this a containing block so the region's position:fixed
    // toasts anchor inside the demo instead of floating over the whole browser page.
    render: (s, set) => h("div", { style: { position: "relative", transform: "translateZ(0)", minHeight: "140px", padding: "10px", border: "var(--brd-hair) dashed color-mix(in srgb, var(--border) 40%, transparent)" } },
      h("button", { className: "cr-btn cr-btn--sm", onClick: () => set("toasts", [...s.toasts, { id: Date.now(), signal: "wait", message: "Queued a job" }]) }, "Push toast"),
      h(CrToastRegion, { toasts: s.toasts, position: s.position, onDismiss: (id) => set("toasts", s.toasts.filter((x) => x.id !== id)) })),
  },

  // ── presentational / form components ─────────────────────────────────────
  button: {
    tag: "CrButton",
    defs: [
      T("enum", "emphasis", "solid", { options: ["solid", "outline", "ghost", "link"] }),
      T("enum", "signal", "", { options: [{ value: "", label: "none" }, "work", "wait", "done", "err", "accent", "accent2"] }),
      T("enum", "size", "md", { options: ["md", "sm"] }),
      T("boolean", "disabled", false),
      T("children", "children", "run scan", { label: "text" }),
    ],
    render: (s) => h("div", { style: { display: "flex", flexDirection: "column", gap: "14px", alignItems: "flex-start" } },
      h(CrButton, { emphasis: s.emphasis, signal: s.signal || undefined, size: s.size, disabled: s.disabled }, s.children),
      // gravity ladder — hierarchy reads by FORM, not just colour
      h("div", { style: { display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" } },
        h(CrButton, {}, "primary"),
        h(CrButton, { emphasis: "outline" }, "secondary"),
        h(CrButton, { emphasis: "ghost" }, "inline"),
        h(CrButton, { emphasis: "link" }, "link"),
        h(CrButton, { emphasis: "outline", signal: "err" }, "delete"))),
  },
  tag: {
    tag: "CrTag",
    defs: [
      T("enum", "signal", "done", { options: ["work", "wait", "done", "err", "idle", "accent"] }),
      T("children", "children", "shipped", { label: "text" }),
    ],
    render: (s) => h(CrTag, { signal: s.signal }, s.children),
  },
  chip: {
    tag: "CrChip",
    defs: [T("enum", "tone", "done", { options: ["done", "alt"] }), T("children", "children", "PTL-757", { label: "text" })],
    render: (s) => h(CrChip, { tone: s.tone }, s.children),
  },
  "status-dot": {
    tag: "CrStatusDot",
    defs: [T("enum", "signal", "work", { options: ["work", "wait", "done", "err", "idle"] }), T("text", "label", "working")],
    render: (s) => h(CrStatusDot, { signal: s.signal, label: s.label }),
  },
  kbd: {
    tag: "CrKbd",
    defs: [T("text", "keys", "⌘K"), T("boolean", "hint", false), T("boolean", "on", false)],
    render: (s) => h(CrKbd, { keys: s.keys, hint: s.hint, on: s.on }),
  },
  checkbox: {
    tag: "CrChoice",
    defs: [
      T("enum", "type", "checkbox", { options: ["checkbox", "radio"] }),
      T("text", "label", "Auto-restart on crash"),
      T("boolean", "checked", true),
      T("boolean", "disabled", false),
    ],
    render: (s, set) => h(CrChoice, { type: s.type, label: s.label, checked: s.checked, disabled: s.disabled, onChange: (v) => set("checked", v) }),
  },
  alert: {
    tag: "CrAlert",
    defs: [
      T("enum", "signal", "info", { options: ["info", "wait", "done", "err"] }),
      T("text", "title", "Region degraded"),
      T("text", "message", "eu-west-1 p95 latency above threshold for 4m."),
      T("boolean", "dismissible", true),
    ],
    render: (s) => h(CrAlert, { signal: s.signal, title: s.title, message: s.message, dismissible: s.dismissible }),
  },
  toast: {
    tag: "CrToast",
    defs: [T("enum", "signal", "done", { options: ["work", "wait", "done", "err"] }), T("text", "message", "Deploy complete")],
    render: (s) => h(CrToast, { signal: s.signal, message: s.message }),
  },
  meter: {
    tag: "CrMeter",
    defs: [
      T("number", "value", 68, { min: 0, max: 100 }),
      T("number", "max", 100),
      T("enum", "signal", "work", { options: ["work", "wait", "done", "err", "idle"] }),
      T("text", "label", "CPU"),
    ],
    render: (s) => h(CrMeter, { value: s.value, max: s.max, signal: s.signal, label: s.label }),
  },
  progress: {
    tag: "CrProgress",
    defs: [
      T("number", "value", 40, { min: 0, max: 100 }),
      T("number", "max", 100),
      T("boolean", "indeterminate", false),
      T("enum", "signal", "work", { options: ["work", "wait", "done", "err"] }),
      T("text", "label", "Uploading"),
    ],
    render: (s) => h(CrProgress, { value: s.value, max: s.max, indeterminate: s.indeterminate, signal: s.signal, label: s.label }),
  },
  sparkline: {
    tag: "CrSparkline",
    defs: [
      T("enum", "signal", "work", { options: ["work", "wait", "done", "err", "idle", "accent", "accent2"] }),
      T("boolean", "area", true),
      T("number", "height", 32, { min: 20, max: 80 }),
      T("text", "label", "p95 latency"),
    ],
    render: (s) => h("div", { style: { display: "flex", alignItems: "center", gap: "10px" } },
      h(CrSparkline, { data: SPARK_DATA, signal: s.signal, area: s.area, height: s.height, label: s.label }),
      h("span", { style: { fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink)" } }, "15")),
  },
  "line-chart": {
    tag: "CrLineChart",
    defs: [
      T("boolean", "area", true),
      T("boolean", "axis", true),
      T("enum", "yScale", "linear", { options: ["linear", "log"] }),
      T("enum", "xScale", "categorical", { options: ["categorical", "clock", "calendar"] }),
      T("enum", "calSpan", "5 months", { options: ["6 weeks", "5 months", "1 year"] }),
      T("enum", "xLocale", "en", { options: ["en", "it"] }),
      T("enum", "xWeek", "date", { options: ["date", "iso"] }),
      T("number", "xFiscalStart", 1, { min: 1, max: 12 }),
      T("text", "unit", ""),
      T("number", "height", 140, { min: 90, max: 220 }),
      T("text", "label", "Throughput vs errors"),
    ],
    render: (s) => {
      const common = { area: s.area, axis: s.axis, yScale: s.yScale, unit: s.unit, height: s.height, label: s.label };
      if (s.yScale === "log" && s.xScale !== "calendar") {
        return h(CrLineChart, { series: LOG_SERIES, labels: LINE_LABELS, ...common });
      }
      if (s.xScale === "calendar") {
        const ds = s.calSpan === "6 weeks" ? CAL_WK : s.calSpan === "1 year" ? CAL_YR : CAL_MO;
        return h(CrLineChart, {
          series: [{ name: "budget", data: ds.data, signal: "work" }],
          x: ds.x, xTime: true, xZone: "Europe/Rome",
          xLocale: s.xLocale, xWeek: s.xWeek, xFiscalStart: s.xFiscalStart,
          ...common, unit: s.unit || "%", label: s.label === "Throughput vs errors" ? "Error budget" : s.label,
        });
      }
      if (s.xScale === "clock") {
        return h(CrLineChart, { series: LINE_SERIES, x: LINE_X, xTime: true, xZone: "UTC", ...common });
      }
      return h(CrLineChart, { series: LINE_SERIES, labels: LINE_LABELS, ...common });
    },
  },
  "bar-chart": {
    tag: "CrBarChart",
    defs: [
      T("boolean", "showValues", true),
      T("boolean", "axis", true),
      T("number", "target", 35, { min: 0, max: 50 }),
      T("text", "unit", ""),
      T("number", "height", 140, { min: 90, max: 220 }),
      T("text", "label", "Sessions by region"),
    ],
    render: (s) => h(CrBarChart, { data: BAR_DATA, showValues: s.showValues, axis: s.axis, target: s.target, unit: s.unit, height: s.height, label: s.label }),
  },
  "stacked-bar": {
    tag: "CrStackedBar",
    defs: [
      T("boolean", "showLegend", true),
      T("text", "label", "Fleet state"),
    ],
    render: (s) => h(CrStackedBar, { segments: STACK_SEGS, showLegend: s.showLegend, label: s.label }),
  },
  form: {
    tag: "CrForm",
    defs: [
      T("enum", "source", "arktype", { options: [{ value: "arktype", label: "ArkType" }, { value: "jsonschema", label: "JSON Schema" }] }),
      T("text", "title", "New session"),
      T("text", "submitLabel", "Create session"),
    ],
    extra: { result: null },
    render: (s, set) => {
      const F = s.source === "jsonschema" ? FORM_JSON : FORM_ARK;
      return h("div", { style: { display: "grid", gap: "14px" } },
        h(CrForm, {
          fields: F.model.fields,
          title: s.title,
          submitLabel: s.submitLabel,
          validate: (vals) => F.validate(vals).errors,
          onSubmit: (vals) => set("result", F.validate(vals).data),
        }),
        h("p", { className: "pg__note", style: { margin: 0 } },
          s.source === "jsonschema"
            ? "validated by ArkType — the type was converted from the JSON Schema below"
            : "validated by ArkType — exportable to the JSON Schema below (feed it back for the same form)"),
        s.result
          ? h("pre", { className: "pg__code" }, "submitted ✓ (coerced + validated)\n" + JSON.stringify(s.result, null, 2))
          : null,
        h("details", null,
          h("summary", { style: { fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)", cursor: "pointer" } }, "exported JSON Schema"),
          h("pre", { className: "pg__code" }, JSON.stringify(FORM_ARK.jsonSchema, null, 2))));
    },
  },
  datagrid: {
    tag: "CrDataGrid",
    defs: [T("boolean", "selectable", true), T("boolean", "variableRows", false)],
    extra: { picked: 0 },
    render: (s, set) =>
      h("div", { style: { display: "grid", gap: "10px" } },
        h("p", { className: "pg__note", style: { margin: 0 } },
          GRID_ROWS.length.toLocaleString() + " rows, virtualized — only the visible slice is in the DOM. Sort a column; select rows"
          + (s.variableRows ? "; rows are variable-height." : ".")),
        h(CrDataGrid, {
          columns: GRID_COLS,
          rows: GRID_ROWS,
          rowKey: "id",
          selectable: s.selectable,
          height: 300,
          rowHeight: s.variableRows ? (row) => 30 + (row.cpu % 4) * 14 : 34,
          onSelectionChange: (keys) => set("picked", keys.length),
        }),
        h("p", { className: "pg__note", style: { margin: 0 } }, s.picked + " selected")),
  },
  input: {
    tag: "CrInput",
    defs: [T("text", "label", "Filter"), T("text", "placeholder", "search sessions…"), T("boolean", "disabled", false), T("boolean", "invalid", false)],
    render: (s) => h(CrInput, { label: s.label, placeholder: s.placeholder, disabled: s.disabled, invalid: s.invalid }),
  },
  textarea: {
    tag: "CrTextarea",
    defs: [T("text", "label", "Notes"), T("text", "placeholder", "notes…"), T("boolean", "disabled", false), T("boolean", "invalid", false)],
    render: (s) => h(CrTextarea, { label: s.label, placeholder: s.placeholder, disabled: s.disabled, invalid: s.invalid }),
  },
  "form-field": {
    tag: "CrField",
    defs: [
      T("text", "label", "Session name"),
      T("text", "value", "prod-scan-eu"),
      T("text", "placeholder", "name…"),
      T("text", "hint", "Lowercase, dashes only."),
      T("text", "error", ""),
    ],
    render: (s, set) => h(CrField, { id: "isl-field", label: s.label, value: s.value, placeholder: s.placeholder, hint: s.hint, error: s.error, onChange: (v) => set("value", v) }),
  },
  breadcrumb: {
    tag: "CrBreadcrumb",
    defs: [T("text", "label", "Breadcrumb")],
    render: (s) => h(CrBreadcrumb, { label: s.label, items: [{ label: "Hub", href: "#" }, { label: "Fleet", href: "#" }, { label: "worker-01" }] }),
  },
  "session-row": {
    tag: "CrSessionRow",
    defs: [
      T("text", "name", "session 4f2a"),
      T("text", "status", "scanning · 68%"),
      T("enum", "signal", "work", { options: ["work", "wait", "done", "err", "idle"] }),
      T("boolean", "event", false),
    ],
    render: (s) => h(CrSessionRow, { name: s.name, status: s.status, signal: s.signal, event: s.event }),
  },
  "empty-error-state": {
    tag: "CrEmptyState",
    defs: [T("text", "message", "No sessions in this region yet.")],
    render: (s) => h(CrEmptyState, { message: s.message }),
  },
  panel: {
    tag: "CrPanel",
    defs: [
      T("text", "title", "Fleet health"),
      T("enum", "weight", "default", { options: ["default", "major"] }),
      T("boolean", "inset", false),
      T("children", "children", "Panel body content.", { label: "body" }),
    ],
    render: (s) => h(CrPanel, { title: s.title, weight: s.weight, inset: s.inset }, s.children),
  },
  icon: {
    tag: "CrIcon",
    defs: [
      T("enum", "name", "deploy", { options: ICON_NAMES }),
      T("number", "size", 24, { min: 12, max: 48 }),
      T("text", "label", "deploy"),
    ],
    render: (s) => h("div", { style: { display: "flex", flexDirection: "column", gap: "14px" } },
      h("div", { style: { display: "flex", alignItems: "center", gap: "10px" } },
        h(CrIcon, { name: s.name, size: s.size, label: s.label }),
        h("code", { style: { fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)" } }, s.name)),
      // the whole set, live, so the browser shows every glyph at a glance
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: "6px" } },
        ICON_NAMES.map((n) => h("div", {
          key: n, title: n,
          style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "8px 4px", border: "var(--brd-hair) solid color-mix(in srgb, var(--border) 45%, transparent)", color: "var(--ink)" },
        },
          h(CrIcon, { name: n, size: 22 }),
          h("span", { style: { fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--muted)" } }, n))))),
  },
};

// ── mount ────────────────────────────────────────────────────────────────
function mountAll() {
  document.querySelectorAll("[data-island]").forEach((el) => {
    const id = el.getAttribute("data-island");
    const demo = DEMOS[id];
    if (!demo) return;
    try {
      createRoot(el).render(h(Playground, demo));
      el.setAttribute("data-island-ready", "1");
    } catch (err) {
      el.setAttribute("data-island-error", String(err && err.message ? err.message : err));
      console.error("island failed:", id, err);
    }
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAll);
else mountAll();

window.__CR_ISLANDS__ = Object.keys(DEMOS);
