// Guard against CSS part MISROUTING.
//
// `build-styles.mjs` partitions components.css by `/* ── Name ── */` section
// headers and routes each whole segment to ONE part file. `verify:styles` only
// asserts the partition rejoins to the source byte-for-byte and that no
// generated file is stale — it is structurally INCAPABLE of catching a rule
// placed under the wrong header, because such a rule is *losslessly* routed to
// the wrong part and the check passes clean.
//
// This shipped a real bug twice: `.cr-modal__head/__title/__body` sat after the
// Cron header (a modal-only consumer got an unstyled header), and a stray
// `@media (prefers-reduced-motion) { .cr-breach--alive }` sat under the ASCII
// decoration header (a breach-only consumer kept animating under reduced
// motion).
//
// The guard: for every part file, each selector must be ANCHORED to that part —
// either its SUBJECT (the rightmost compound, i.e. the element the rule actually
// styles) belongs to the part's own `.cr-<slug>` family, or some ANCESTOR in the
// selector does. The second case is what makes contextual rules legal:
// `.cr-form__control .cr-input` belongs in form.css because it only applies
// inside a form, so a form-only consumer needs it and an input-only consumer
// must not get it. A selector anchored to NEITHER is misrouted by definition.

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PARTS_DIR = join(ROOT, "packages", "styles", "styles", "parts");

// NOTE: shared chassis primitives (`.cr-dismiss`, `.cr-plate`, `.cr-tally`, the
// tap-floor list …) need no allowlist. They are authored in base.css or in a
// section whose name owns no part slug, so `ownerOf` returns null for them and
// the check below skips them by construction. An allowlist would be dead code
// today and would silently weaken the guard the day one of those names DID
// become a part.

const slugsOf = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".css"))
    .map((f) => f.replace(/\.css$/, ""));

/** Selectors of every style rule, with at-rule preludes and comments removed. */
function selectorsOf(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  for (const m of clean.matchAll(/([^{}]+)\{/g)) {
    const prelude = m[1].trim();
    // skip at-rule preludes (@media/@supports/@keyframes) and keyframe stops
    if (!prelude || prelude.startsWith("@")) continue;
    for (const part of prelude.split(",")) {
      const sel = part.trim();
      if (!sel || /^(?:from|to|\d+%)$/.test(sel)) continue;
      out.push(sel);
    }
  }
  return out;
}

/**
 * The rightmost compound selector — the element the rule actually styles.
 * Descendant/child/sibling combinators all end the previous compound.
 */
function subjectOf(sel) {
  const flat = sel.replace(/\s*[>+~]\s*/g, " ");
  return flat.split(/\s+/).filter(Boolean).pop() ?? "";
}

/** `.cr-*` class names in a compound, pseudo-elements/classes stripped. */
function crClassesIn(compound) {
  const bare = compound.replace(/::?[a-z-]+(\([^)]*\))?/g, "");
  return [...bare.matchAll(/\.(cr-[a-z0-9_-]+)/g)].map((m) => m[1]);
}

/**
 * Which part slug owns a class name. Longest match wins so `.cr-toggle-chip`
 * resolves to `toggle-chip`, not `chip`, and `.cr-ascii-bar` (authored in the
 * "ASCII rules" section) resolves to `ascii-rules` only if such a slug claims
 * it — a bare prefix like `cr-ascii-` must NOT steal it from `ascii-rules`.
 */
function ownerOf(cls, slugs) {
  let best = null;
  for (const s of slugs) {
    const stem = `cr-${s}`;
    const owns = cls === stem || cls.startsWith(`${stem}__`) || cls.startsWith(`${stem}--`);
    if (owns && (!best || s.length > best.length)) best = s;
  }
  return best;
}

test("every part file only styles its own .cr-<slug> family", () => {
  const slugs = slugsOf(PARTS_DIR);
  assert.ok(slugs.length > 50, `sanity: found ${slugs.length} part files`);

  const violations = [];
  for (const slug of slugs) {
    const css = readFileSync(join(PARTS_DIR, `${slug}.css`), "utf8");
    for (const sel of selectorsOf(css)) {
      // Anchored via an ancestor? Then the rule only applies inside this part,
      // so it belongs here (e.g. `.cr-form__control .cr-input` in form.css).
      const ancestorAnchored = crClassesIn(sel.replace(/\s*[>+~]\s*/g, " ")).some(
        (cls) => ownerOf(cls, slugs) === slug
      );
      if (ancestorAnchored) continue;

      for (const cls of crClassesIn(subjectOf(sel))) {
        const owner = ownerOf(cls, slugs);
        // No owner => a family with no part of its own (shared primitive); fine.
        if (owner && owner !== slug) {
          violations.push(
            `parts/${slug}.css styles .${cls} (belongs in parts/${owner}.css) — "${sel}"`
          );
        }
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `misrouted CSS — a rule sits under the wrong \`/* ── Name ── */\` header in ` +
      `styles/components.css, so per-part consumers get it in the wrong file:\n  ` +
      violations.join("\n  ")
  );
});
