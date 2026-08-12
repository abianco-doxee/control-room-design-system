// Guard against CSS part MISROUTING.
//
// `build-styles.mjs` partitions components.css by `/* ── Name ── */` section
// headers and routes each whole segment to ONE part file. `verify:styles` only
// asserts the partition rejoins to the source byte-for-byte and that no
// generated file is stale — it is structurally INCAPABLE of catching a rule
// placed under the wrong header, because such a rule is *losslessly* routed to
// the wrong part and the check passes clean.
//
// This shipped real bugs three times: `.cr-modal__head/__title/__body` sat after
// the Cron header (a modal-only consumer got an unstyled header); a stray
// `@media (prefers-reduced-motion) { .cr-breach--alive }` sat under the ASCII
// decoration header; and `@media (prefers-reduced-motion) { .cr-btn }` sat under
// the glitch-tiers header (a button-only consumer kept transitioning).
//
// OWNERSHIP IS NOT SPELLING. An earlier version of this guard derived a class's
// owning part from its name (`.cr-<slug>`), which silently skipped every family
// whose class name differs from its slug — `.cr-btn` → `button`, `.cr-sev` →
// `shape`, `.cr-row` → `session-row`, `.cr-grid` → `data-grid`. That was 25 of
// 73 part files invisible, and the `.cr-btn` bug above was shipping inside the
// gap. Ownership is therefore derived from the SOURCE: a class belongs to the
// part that the section it is *defined* in routes to, using `targetFor` — the
// same authoritative mapping (SLUG_MAP + GROUP) the build itself routes by.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { segment, targetFor } from "../packages/styles/build/build-styles.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "packages", "styles", "styles", "components.css");

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
 * Build the authoritative class → owning-part map from the source itself.
 *
 * A class is OWNED by the part whose section styles it as a rule SUBJECT. Base
 * sections do NOT confer ownership: the chassis layer (`__preamble__`,
 * "Interaction states", "Sizing & touch targets" …) deliberately reaches across
 * many families at once — `.cr-btn` is styled in four of them — so treating a
 * base appearance as the definition would leave the class unowned and silently
 * disable the check for it. Only a component section defines a family.
 *
 * A class styled solely by base sections is genuinely unowned: it is a
 * cross-cutting primitive (`.cr-dismiss`, `.cr-tex--*`) reachable from any part.
 *
 * Where two component sections both style a family (Button + EMPHASIS + SIGNAL
 * all route to `button`), they agree by construction, since ownership is keyed
 * on the routed slug rather than on the section name.
 */
function buildOwnership(css) {
  const owner = new Map();
  for (const seg of segment(css)) {
    const target = targetFor(seg.name);
    if (target.kind === "base") continue; // chassis sections confer no ownership
    for (const sel of selectorsOf(seg.body.join("\n"))) {
      // Only an UNQUALIFIED rule defines a family. `.cr-form__control .cr-input`
      // (in the Form section) styles an input *in a form context*; it does not
      // define `.cr-input`, which the Input section owns. Counting contextual
      // rules as definitions would hand ownership to whichever section merely
      // mentioned the class first.
      const subject = subjectOf(sel);
      if (subject !== sel.replace(/\s*[>+~]\s*/g, " ").trim()) continue;
      for (const cls of crClassesIn(subject)) {
        if (!owner.has(cls)) owner.set(cls, target.slug);
      }
    }
  }
  return owner;
}

test("every CSS rule is filed under the section header that owns it", () => {
  const css = readFileSync(SRC, "utf8");
  const owner = buildOwnership(css);

  // Sanity: the ownership map must actually see the families whose class names
  // do NOT match their slug. These are exactly the cases the old spelling-based
  // check was blind to, so assert them explicitly — if this map ever silently
  // stops resolving them, the guard has regressed to the old blind spot.
  for (const [cls, expected] of [
    ["cr-btn", "button"],
    ["cr-sev", "shape"],
    ["cr-row", "session-row"],
    ["cr-grid", "data-grid"],
  ]) {
    assert.equal(owner.get(cls), expected, `ownership map resolves .${cls} → ${expected}`);
  }

  const violations = [];
  for (const seg of segment(css)) {
    const target = targetFor(seg.name);
    if (target.kind === "base") continue; // base is the shared chassis layer
    const slug = target.slug;

    for (const sel of selectorsOf(seg.body.join("\n"))) {
      // Anchored via an ancestor? Then the rule only applies inside this part,
      // so it belongs here (e.g. `.cr-form__control .cr-input` in form.css).
      const anchored = crClassesIn(sel.replace(/\s*[>+~]\s*/g, " ")).some(
        (cls) => owner.get(cls) === slug
      );
      if (anchored) continue;

      for (const cls of crClassesIn(subjectOf(sel))) {
        const home = owner.get(cls);
        // null/undefined => a shared chassis primitive with no owning part.
        if (home && home !== slug) {
          violations.push(
            `section "${seg.name}" → parts/${slug}.css styles .${cls} ` +
              `(defined in parts/${home}.css) — "${sel}"`
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
