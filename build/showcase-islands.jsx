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
} from "../dist/frameworks/react/index.ts";

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
  return h("label", { className: "pg__ctl" }, // text
    h("span", { className: "pg__ctl-name" }, label),
    h("input", { type: "text", value, onChange: (e) => set(def.prop, e.target.value) }));
}

function snippet(tag, defs, state) {
  const parts = [];
  for (const d of defs) {
    const v = state[d.prop];
    if (d.type === "boolean") { if (v) parts.push(d.prop); }
    else if (d.type === "number") parts.push(`${d.prop}={${v}}`);
    else parts.push(`${d.prop}="${v}"`);
  }
  const attrs = parts.length ? " " + parts.join(" ") : "";
  return `<${tag}${attrs} />`;
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
    defs: [T("text", "placeholder", "Search regions…"), T("text", "label", "Region")],
    render: (s) => h(CrCombobox, { options: OPTIONS, label: s.label, placeholder: s.placeholder, onChange: () => {} }),
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
    defs: [T("text", "value", "0 9 * * 1-5"), T("text", "label", "Schedule"), T("boolean", "invalid", false)],
    render: (s, set) => h(CrCronField, { value: s.value, presets: CRON_PRESETS, description: describeCron(s.value), label: s.label, invalid: s.invalid, onChange: (v) => set("value", v) }),
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
    tag: "CrSelect", defs: [T("boolean", "disabled", false)],
    render: (s) => h("div", { style: { display: "flex", flexDirection: "column", gap: "4px" } },
      h("label", { htmlFor: "isl-select", style: { fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)" } }, "Region"),
      h(CrSelect, { id: "isl-select", options: ["eu-west-1", "us-east-1", "ap-south-1"], disabled: s.disabled })),
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
    render: (s, set) => h("div", null,
      h("button", { className: "cr-btn cr-btn--sm", onClick: () => set("toasts", [...s.toasts, { id: Date.now(), signal: "wait", message: "Queued a job" }]) }, "Push toast"),
      h(CrToastRegion, { toasts: s.toasts, position: s.position, onDismiss: (id) => set("toasts", s.toasts.filter((x) => x.id !== id)) })),
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
