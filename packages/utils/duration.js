// humanDuration(ms) / relativeTime(then, now) — compact, dependency-free time
// formatting for dense operator UIs. Ported from dp-tooling (there it wrapped
// pretty-ms; inlined here to keep the package dependency-free).
//
// Discipline: NEVER read the clock internally. Pass `now` in. Reading Date.now()
// during render gives the server and the client different answers → a hydration
// flicker on every SSR framework. The caller owns the clock (a prop, a store, a
// tick), so the same inputs always render the same output.
//
//   import { humanDuration, relativeTime } from "@abianco-doxee/cr-design-system/duration";
//   humanDuration(90_000)            // "1m 30s"
//   relativeTime(then, Date.now())   // "5m ago" / "in 2h"

const UNITS = [
  ["d", 86400000],
  ["h", 3600000],
  ["m", 60000],
  ["s", 1000],
];

// Compact duration: the two largest non-zero units (e.g. "1h 4m", "45s", "2d 3h").
export function humanDuration(ms, opts) {
  const parts = compactParts(ms, (opts && opts.max) || 2);
  return parts.length ? parts.join(" ") : "0s";
}

// A cadence phrase like "every 5m" for a refresh interval.
export function refreshCadence(ms) {
  return "every " + humanDuration(ms, { max: 1 });
}

// Signed relative phrase between two epoch-ms timestamps. `now` is REQUIRED — see
// the header note on the clock.
export function relativeTime(then, now) {
  const delta = now - then;
  const abs = Math.abs(delta);
  if (abs < 45000) return "just now";
  const phrase = humanDuration(abs, { max: 1 });
  return delta >= 0 ? phrase + " ago" : "in " + phrase;
}

function compactParts(ms, max) {
  let rest = Math.max(0, Math.floor(ms));
  const out = [];
  for (const [label, size] of UNITS) {
    if (rest >= size) {
      const n = Math.floor(rest / size);
      rest -= n * size;
      out.push(n + label);
      if (out.length >= max) break;
    } else if (out.length) {
      // once we've emitted a larger unit, keep going to fill `max` slots
      if (label === "s" && out.length < max && rest === 0) break;
    }
  }
  return out;
}

export default humanDuration;
