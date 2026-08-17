// humanDuration(ms) / relativeTime(then, now) — compact, dependency-free time
// formatting for dense operator UIs. Ported from dp-tooling (there it wrapped
// pretty-ms; inlined here to keep the package dependency-free).
//
// Discipline: NEVER read the clock internally. Pass `now` in. Reading Date.now()
// during render gives the server and the client different answers → a hydration
// flicker on every SSR framework. The caller owns the clock (a prop, a store, a
// tick), so the same inputs always render the same output.
//
//   import { humanDuration, relativeTime } from "@alebianco/cr-design-system/duration";
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
// Localised via Intl.RelativeTimeFormat — MUST stay in lockstep with the
// CrRelativeTime component, which renders the same phrase (a parity test asserts
// the two match exactly). `style: "narrow"` keeps the terse machine register: in
// English it is byte-identical to the previous hand-rolled output ("5m ago",
// "in 2h"). A few CLDR locales render narrow as a bare +/- sign ("-5 min"), which
// reads as a delta rather than an elapsed time, so those take "short" instead —
// a BEHAVIOUR table, not a translation table.
//
// `numeric: "auto"` yields the locale's own "now"/"ora"/"jetzt" for the sub-45s
// case, replacing the hand-written "just now".
export function relativeTime(then, now, locale) {
  const delta = now - then;
  const abs = Math.abs(delta);
  const loc = locale || "en";
  const rtf = new Intl.RelativeTimeFormat(loc, {
    numeric: "auto",
    style: loc.split("-")[0] === "fr" ? "short" : "narrow",
  });
  if (abs < 45000) return rtf.format(0, "second");
  // Unit SELECTION stays ours (Intl formats a value+unit pair, it does not pick
  // the unit), so the d/h/m/s ladder is unchanged.
  let value, unit;
  if (abs >= 86400000) { value = Math.floor(abs / 86400000); unit = "day"; }
  else if (abs >= 3600000) { value = Math.floor(abs / 3600000); unit = "hour"; }
  else if (abs >= 60000) { value = Math.floor(abs / 60000); unit = "minute"; }
  else { value = Math.max(1, Math.floor(abs / 1000)); unit = "second"; }
  return rtf.format(delta >= 0 ? -value : value, unit);
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
