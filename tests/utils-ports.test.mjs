// Unit tests for the ported utilities (href, duration). Pure functions, no DOM.

import assert from "node:assert/strict";
import { test } from "node:test";
import { humanDuration, refreshCadence, relativeTime } from "@alebianco/cr-utils/duration";
import { externalAttrs, isExternalHref } from "@alebianco/cr-utils/href";

test("isExternalHref: relative/in-page/scheme links are not external", () => {
  for (const h of ["#top", "/dashboard", "./x", "../y", "?q=1", "mailto:a@b.co", "tel:+1", ""]) {
    assert.equal(isExternalHref(h), false, `${h} is not external`);
  }
  assert.equal(isExternalHref(null), false);
  assert.equal(isExternalHref(undefined), false);
});

test("isExternalHref: absolute off-origin http(s) links are external (SSR-safe)", () => {
  // In Node (no location) an absolute http(s) URL is treated as external.
  assert.equal(isExternalHref("https://example.com/x"), true);
  assert.equal(isExternalHref("http://other.test"), true);
  assert.equal(isExternalHref("ftp://x"), false); // non-web scheme
});

test("externalAttrs opens off-site links safely", () => {
  assert.deepEqual(externalAttrs("https://example.com"), {
    target: "_blank",
    rel: "noopener noreferrer",
  });
  assert.deepEqual(externalAttrs("/local"), {});
});

test("humanDuration: two largest non-zero units, compact", () => {
  assert.equal(humanDuration(1000), "1s");
  assert.equal(humanDuration(90000), "1m 30s");
  assert.equal(humanDuration(3600000 + 4 * 60000), "1h 4m");
  assert.equal(humanDuration(2 * 86400000 + 3 * 3600000), "2d 3h");
  assert.equal(humanDuration(0), "0s");
  assert.equal(humanDuration(500, { max: 1 }), "0s"); // sub-second → floor
});

test("refreshCadence uses one unit", () => {
  assert.equal(refreshCadence(300000), "every 5m");
});

test("relativeTime is signed and clock-injected (no internal Date.now)", () => {
  const now = 1_000_000_000_000;
  // The terse machine register is unchanged by the move to Intl — these two are
  // byte-identical to the hand-rolled output, which is the regression check.
  assert.equal(relativeTime(now - 5 * 60000, now), "5m ago");
  assert.equal(relativeTime(now + 2 * 3600000, now), "in 2h");
  // Sub-45s now comes from `numeric: "auto"`, so it is the locale's own word for
  // the present ("now") rather than the hand-written "just now".
  assert.equal(relativeTime(now - 1000, now), "now");
});

test("relativeTime is localised, and unit selection stays ours", () => {
  const now = 1_000_000_000_000;
  assert.equal(relativeTime(now - 5 * 60000, now, "it"), "5 min fa");
  assert.equal(relativeTime(now - 2 * 3600000, now, "de"), "vor 2 Std.");
  // French renders `narrow` as a bare sign ("-5 min"), which reads as a delta, so
  // it falls back to `short`. Guards the behaviour table in duration.js.
  // NB: CLDR separates the number from the unit with U+00A0 (non-breaking space)
  // in fr — compare on the normalised string so the intent is legible.
  assert.equal(relativeTime(now - 5 * 60000, now, "fr").replace(/ /g, " "), "il y a 5 min");
  // The d/h/m/s ladder is ours, not Intl's: 2 days must not become "the day
  // before yesterday" style prose at the wrong granularity.
  assert.equal(relativeTime(now - 3 * 86400000, now), "3d ago");
});
