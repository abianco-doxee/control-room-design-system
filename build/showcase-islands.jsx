/**
 * Live islands for the Component Browser.
 *
 * Every demo below imports the ACTUAL compiled React component from
 * dist/frameworks/react (the same output shipped to consumers) and renders it —
 * controlled components get a tiny stateful wrapper so onChange actually drives
 * them. This bundle is built by build/build-showcase.mjs (esbuild → inlined IIFE)
 * and mounts into each <div data-island="<catalog-id>"> the browser emits.
 *
 * If a component can't be demoed live it simply has no entry here and the card
 * falls back to its static state snippets — nothing hand-writes component markup.
 */
import * as React from "react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CrAccordion,
  CrTabs,
  CrMenu,
  CrCombobox,
  CrPalette,
  CrTree,
  CrDrawer,
  CrPopover,
  CrHoverCard,
  CrSegmented,
  CrRadioGroup,
  CrSlider,
  CrNumberField,
  CrPagination,
  CrDateTime,
  CrCronField,
  CrModal,
  CrSwitch,
  CrSelect,
  CrTooltip,
  CrTable,
  CrToastRegion,
} from "../dist/frameworks/react/index.ts";

const h = React.createElement;

// ── demo data ────────────────────────────────────────────────────────────
const TREE = [
  {
    id: "w1", label: "worker-01 · eu-west",
    children: [
      { id: "s1", label: "session 4f2a · scan" },
      { id: "s2", label: "session 9c1d · deploy" },
    ],
  },
  {
    id: "w2", label: "worker-02 · us-east",
    children: [{ id: "s3", label: "session 71be · idle" }],
  },
];
const COMMANDS = [
  { id: "deploy", label: "Deploy current build", hint: "⌘⏎", group: "Actions" },
  { id: "scan", label: "Run integrity scan", group: "Actions" },
  { id: "logs", label: "Open logs", hint: "L", group: "Navigate" },
  { id: "kill", label: "Kill session", group: "Danger" },
];
const OPTIONS = [
  { value: "eu-west", label: "eu-west-1" },
  { value: "us-east", label: "us-east-1" },
  { value: "ap-south", label: "ap-south-1" },
];
const CRON_PRESETS = [
  { label: "Hourly", cron: "0 * * * *" },
  { label: "Weekdays 9am", cron: "0 9 * * 1-5" },
  { label: "Nightly", cron: "0 0 * * *" },
];
// tiny built-in cron describer (the shipped component takes `description` injected;
// the console app wires cronstrue — here a small map keeps the island dep-free).
const CRON_TEXT = {
  "0 * * * *": "At minute 0 of every hour.",
  "0 9 * * 1-5": "At 09:00 AM, Monday through Friday.",
  "0 0 * * *": "At 12:00 AM, every day.",
};
const describeCron = (c) => CRON_TEXT[c.trim()] || "Custom schedule.";

// controlled-state helper
function useCtl(initial) {
  const [v, set] = useState(initial);
  return [v, set];
}

// ── per-component demos (keyed by catalog id) ──────────────────────────────
const DEMOS = {
  accordion: () =>
    h(CrAccordion, {
      single: true,
      defaultOpen: [0],
      items: [
        { title: "Provisioning", body: "Workers spin up from the warm pool; cold starts fall back to on-demand." },
        { title: "Scheduling", body: "Sessions are placed by region affinity, then by least-loaded worker." },
        { title: "Teardown", body: "Idle sessions are parked after 5m and reaped after 30m." },
      ],
    }),

  tabs: () => {
    const [active, setActive] = useCtl(0);
    return h("div", null,
      h(CrTabs, { tabs: ["Overview", "Sessions", "Logs"], active, onChange: setActive }),
      h("p", { style: { marginTop: "8px", color: "var(--muted)" } }, `panel ${active + 1} selected`));
  },

  menu: () =>
    h(CrMenu, {
      label: "Actions",
      items: [{ label: "Rename" }, { label: "Duplicate" }, { label: "Delete", danger: true }],
    }),

  combobox: () => {
    const [val, setVal] = useCtl("");
    return h("div", null,
      h(CrCombobox, { options: OPTIONS, value: val, label: "Region", placeholder: "Search regions…", onChange: setVal }),
      h("p", { style: { marginTop: "8px", color: "var(--muted)" } }, val ? `picked: ${val}` : "type to filter"));
  },

  palette: () => {
    const [open, setOpen] = useCtl(false);
    return h("div", null,
      h("button", { className: "cr-btn cr-btn--sm", onClick: () => setOpen(true) }, "Open palette ⌘K"),
      h(CrPalette, { open, commands: COMMANDS, placeholder: "Type a command…", onRun: () => setOpen(false), onClose: () => setOpen(false) }));
  },

  tree: () => h(CrTree, { nodes: TREE, label: "Fleet", defaultExpanded: ["w1"] }),

  drawer: () => {
    const [open, setOpen] = useCtl(false);
    return h("div", null,
      h("button", { className: "cr-btn cr-btn--sm", onClick: () => setOpen(true) }, "Open drawer"),
      h(CrDrawer, { open, title: "Session inspector", side: "right", onClose: () => setOpen(false) },
        h("p", { style: { color: "var(--muted)" } }, "Live drawer content. Esc or the backdrop closes it.")));
  },

  popover: () =>
    h(CrPopover, { label: "Details", title: "Worker health" },
      h("p", { style: { color: "var(--muted)", margin: 0 } }, "CPU 41% · mem 3.2/8GB · 2 sessions")),

  "hover-card": () =>
    h(CrHoverCard, { label: "eu-west-01", title: "Region status" },
      h("p", { style: { color: "var(--muted)", margin: 0 } }, "12 workers · 41 sessions · p95 210ms")),

  segmented: () => {
    const [v, setV] = useCtl("live");
    return h(CrSegmented, {
      label: "View",
      value: v,
      onChange: setV,
      options: [{ value: "live", label: "Live" }, { value: "1h", label: "1h" }, { value: "24h", label: "24h" }],
    });
  },

  "radio-group": () => {
    const [v, setV] = useCtl("balanced");
    return h(CrRadioGroup, {
      label: "Placement",
      value: v,
      onChange: setV,
      options: [
        { value: "packed", label: "Bin-packed" },
        { value: "balanced", label: "Balanced" },
        { value: "spread", label: "Spread" },
      ],
    });
  },

  slider: () => {
    const [v, setV] = useCtl(60);
    return h(CrSlider, { value: v, min: 0, max: 100, step: 5, label: `Throttle · ${v}%`, onChange: setV });
  },

  "number-field": () => {
    const [v, setV] = useCtl(4);
    return h(CrNumberField, { value: v, min: 1, max: 32, step: 1, label: "Replicas", onChange: setV });
  },

  pagination: () => {
    const [p, setP] = useCtl(3);
    return h(CrPagination, { page: p, total: 9, onChange: setP });
  },

  datetime: () => {
    const [v, setV] = useCtl("2026-08-04T09:00");
    return h(CrDateTime, { value: v, kind: "datetime-local", label: "First run", onChange: setV });
  },

  "cron-field": () => {
    const [v, setV] = useCtl("0 9 * * 1-5");
    return h(CrCronField, { value: v, presets: CRON_PRESETS, description: describeCron(v), label: "Schedule", onChange: setV });
  },

  modal: () => {
    const [open, setOpen] = useCtl(false);
    return h("div", null,
      h("button", { className: "cr-btn cr-btn--sm", onClick: () => setOpen(true) }, "Open modal"),
      h(CrModal, { open, title: "Confirm teardown", onClose: () => setOpen(false) },
        h("p", { style: { color: "var(--muted)" } }, "This reaps 3 idle sessions. Esc or the backdrop closes it.")));
  },

  switch: () => {
    const [on, setOn] = useCtl(true);
    return h(CrSwitch, { checked: on, label: on ? "Auto-scale on" : "Auto-scale off", onChange: setOn });
  },

  // CrSelect is a bare <select> primitive (no label prop) — composed with a
  // label the way a real form would, associated via id for an accessible name.
  select: () =>
    h("div", { style: { display: "flex", flexDirection: "column", gap: "4px" } },
      h("label", { htmlFor: "isl-select", style: { fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)" } }, "Region"),
      h(CrSelect, { id: "isl-select", options: ["eu-west-1", "us-east-1", "ap-south-1"] })),

  tooltip: () =>
    h(CrTooltip, { label: "Reaps sessions idle > 30m" }, h("button", { className: "cr-btn cr-btn--sm" }, "Hover me")),

  table: () =>
    h(CrTable, {
      sortable: true,
      selectable: true,
      columns: ["Session", "Region", "State", "p95"],
      rows: [
        ["4f2a", "eu-west", "work", "210ms"],
        ["9c1d", "us-east", "wait", "980ms"],
        ["71be", "ap-south", "idle", "—"],
      ],
    }),

  "toast-region": () => {
    const [toasts, setToasts] = useCtl([
      { id: 1, signal: "done", message: "Deploy complete" },
      { id: 2, signal: "work", message: "Scanning 3 workers…" },
    ]);
    return h("div", null,
      h("button", {
        className: "cr-btn cr-btn--sm",
        onClick: () => setToasts((t) => [...t, { id: Date.now(), signal: "wait", message: "Queued a job" }]),
      }, "Push toast"),
      h(CrToastRegion, {
        toasts,
        position: "br",
        onDismiss: (id) => setToasts((t) => t.filter((x) => x.id !== id)),
      }));
  },
};

// ── mount ──────────────────────────────────────────────────────────────────
function mountAll() {
  const nodes = document.querySelectorAll("[data-island]");
  nodes.forEach((el) => {
    const id = el.getAttribute("data-island");
    const Demo = DEMOS[id];
    if (!Demo) return;
    try {
      createRoot(el).render(h(Demo));
      el.setAttribute("data-island-ready", "1");
    } catch (err) {
      el.setAttribute("data-island-error", String(err && err.message ? err.message : err));
      // eslint-disable-next-line no-console
      console.error("island failed:", id, err);
    }
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAll);
else mountAll();

// expose the id list so the generator/tests can assert coverage
window.__CR_ISLANDS__ = Object.keys(DEMOS);
