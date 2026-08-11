#!/usr/bin/env node
/**
 * Split the shipped stylesheet into partial imports (PrimeVue-style).
 *
 * styles/components.css stays the authored SOURCE and the all-in-one bundle
 * (exported as ./components). This projects it — losslessly — into:
 *   - styles/base.css          the thin global/chassis layer (imported as one bundle
 *                              when NOT unstyled): resets, roundable surfaces, shared
 *                              primitives, interaction states, responsive/type/tap-floor.
 *   - styles/parts/<slug>.css  one file per component (exported as ./styles/<slug>.css),
 *                              so a consumer pulls only the components they use.
 *
 * The split is an EXACT partition: concatenating base + every part in source order
 * reproduces components.css byte-for-byte (asserted here). `--check` fails if the
 * generated parts are stale. Run in the build chain after the CSS is authored.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "styles", "components.css");
const PARTS_DIR = join(ROOT, "styles", "parts");
const BASE_FILE = join(ROOT, "styles", "base.css");
const CHECK = process.argv.includes("--check");

// Section header shape: `/* ── Name (…) ─────── */`. A new segment starts on each.
const HEADER = /^\/\* ── /;

// Header-name → target routing (names lower-cased). Base = cross-cutting chassis +
// shared primitives + responsive; grouped = merged into a component part; SLUG_MAP
// gives catalog-aligned filenames; anything else becomes its own part (auto slug).
const TO_BASE = new Set([
  "__preamble__",
  "diagonal primitives",
  "interaction states",
  "texture utilities",
  "ambient loops",
  "governed motion: glitch · attention · interaction · 3d break",
  "richer texture",
  "scroll-bound progress rail",
  "responsive type architecture",
  "density",
  "sizing & touch targets",
  "container-query layout",
]);
const GROUP = {
  emphasis: "button",
  signal: "button",
};
// name (lower-cased) → part slug (matches catalog ids where a component exists)
const SLUG_MAP = {
  "bezel + screen": "bezel",
  "arrow-rail": "arrow-rail",
  "drip / error surface": "drip",
  statusdot: "status-dot",
  sessionrow: "session-row",
  "nav rail": "nav",
  "keyed contact sheet": "contact-sheet",
  "instrument shell": "instrument",
  "form field wrapper": "form-field",
  "text input / textarea / select": "input",
  "checkbox / radio": "checkbox",
  "command palette": "palette",
  "alert / callout": "alert",
  "data / description list": "data-list",
  "drawer / sheet": "drawer",
  "segmented control": "segmented",
  "number field": "number-field",
  "ascii separators & lists": "ascii-separators",
  "ascii rules · meters · spinner": "ascii-rules",
  "hover card": "hover-card",
  "cron field": "cron",
  "toast region": "toast-region",
  "key-hint badges": "kbd",
  "severity shapes": "shape",
  "hardware chrome vocabulary": "chrome",
  "the breach": "breach",
  "ascii / pixel decoration for dead space": "ascii",
  "data grid": "data-grid",
  inputgroup: "input-group",
  pininput: "pin-input",
  tagsinput: "tags-input",
  scrollarea: "scroll-area",
  togglechip: "toggle-chip",
  relativetime: "relative-time",
  fileupload: "file-upload",
};

function nameOf(headerLine) {
  // strip `/* ── ` then take up to the first ` (`, ` —`, ` –`, or box rule `─`
  const m = headerLine.match(/^\/\* ── (.+?)(?: [—–(]| ─| \*\/|$)/);
  return (m ? m[1] : "misc").trim();
}
const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function segment(css) {
  const lines = css.split("\n");
  const segs = [];
  let cur = { name: "__preamble__", body: [] };
  for (const line of lines) {
    if (HEADER.test(line)) {
      segs.push(cur);
      cur = { name: nameOf(line), body: [line] };
    } else {
      cur.body.push(line);
    }
  }
  segs.push(cur);
  return segs;
}

function targetFor(name) {
  const key = name.toLowerCase();
  if (TO_BASE.has(key)) return { kind: "base" };
  if (GROUP[key]) return { kind: "part", slug: GROUP[key] };
  if (SLUG_MAP[key]) return { kind: "part", slug: SLUG_MAP[key] };
  return { kind: "part", slug: slug(name) };
}

const css = readFileSync(SRC, "utf8");
const segs = segment(css);

// Route each segment; preserve source order within every target for a lossless join.
const base = [];
const parts = new Map(); // slug -> string[]
for (const seg of segs) {
  const text = seg.body.join("\n");
  const t = targetFor(seg.name);
  if (t.kind === "base") base.push(text);
  else {
    if (!parts.has(t.slug)) parts.set(t.slug, []);
    parts.get(t.slug).push(text);
  }
}

// Self-check: the partition must reproduce the source exactly, in order.
const rejoined = segs.map((s) => s.body.join("\n")).join("\n");
if (rejoined !== css) {
  console.error("build-styles: internal partition mismatch (segmentation is not lossless)");
  process.exit(1);
}

const BANNER = (what) =>
  `/* GENERATED by build/build-styles.mjs from styles/components.css — do not edit.\n * ${what} Re-run \`npm run build:styles\`. */\n`;

const baseOut =
  BANNER("Thin base/chassis layer (import once when not unstyled).") + base.join("\n") + "\n";
const partOut = new Map();
for (const [s, chunks] of parts) {
  partOut.set(s, BANNER(`Component part: .cr-${s} family.`) + chunks.join("\n") + "\n");
}

// Ordered manifest (source order of first appearance) for docs/tooling.
const order = [];
for (const seg of segs) {
  const t = targetFor(seg.name);
  const id = t.kind === "base" ? "base" : t.slug;
  if (!order.includes(id)) order.push(id);
}
const manifest =
  JSON.stringify({ base: "base.css", parts: [...partOut.keys()].sort(), order }, null, 2) + "\n";

if (CHECK) {
  const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);
  let stale = read(BASE_FILE) !== baseOut;
  for (const [s, out] of partOut) if (read(join(PARTS_DIR, `${s}.css`)) !== out) stale = true;
  if (read(join(PARTS_DIR, "manifest.json")) !== manifest) stale = true;
  // stale if a part file exists that we no longer emit
  if (existsSync(PARTS_DIR)) {
    for (const f of readdirSync(PARTS_DIR)) {
      if (f === "manifest.json") continue;
      if (!partOut.has(f.replace(/\.css$/, ""))) stale = true;
    }
  }
  if (stale) {
    console.error("✗ styles parts are stale — run `npm run build:styles`");
    process.exit(1);
  }
  console.log(`✓ styles parts up to date (base + ${partOut.size} parts)`);
  process.exit(0);
}

rmSync(PARTS_DIR, { recursive: true, force: true });
mkdirSync(PARTS_DIR, { recursive: true });
writeFileSync(BASE_FILE, baseOut);
for (const [s, out] of partOut) writeFileSync(join(PARTS_DIR, `${s}.css`), out);
writeFileSync(join(PARTS_DIR, "manifest.json"), manifest);
console.log(`wrote styles/base.css + styles/parts/*.css (${partOut.size} component parts)`);
