// The key-hint grammar: `+` joins a chord (pressed together), a space joins a
// sequence (pressed in order). The whole CrKeyHints `hints` API rests on this
// parse being right, and on the spoken form being what a screen reader hears —
// the keycaps are aria-hidden, so describeKeys() IS the accessible name.
import assert from "node:assert/strict";
import { test } from "node:test";
import { describeKeys, parseKeys, speakKey } from "../packages/components/lib/keys.ts";

test("chord, sequence, and the two combined", () => {
  assert.deepEqual(parseKeys("Ctrl+K"), [["Ctrl", "K"]]);
  assert.deepEqual(parseKeys("g p"), [["g"], ["p"]]);
  assert.deepEqual(parseKeys("Ctrl+K p"), [["Ctrl", "K"], ["p"]]);
});

test("empty and whitespace-only input parse to nothing (never an empty keycap)", () => {
  assert.deepEqual(parseKeys(""), []);
  assert.deepEqual(parseKeys("   "), []);
  assert.equal(describeKeys(""), "");
  // non-strings must not throw — the prop is author-supplied
  assert.deepEqual(parseKeys(undefined), []);
  assert.deepEqual(parseKeys(null), []);
});

test("any whitespace splits a sequence, and runs collapse", () => {
  const want = [["g"], ["p"]];
  assert.deepEqual(parseKeys("g p"), want);
  assert.deepEqual(parseKeys("g   p"), want);
  assert.deepEqual(parseKeys(" g p "), want);
  // a stray tab/newline in authored markup is a sequence break, never part of
  // a key name — splitting on " " alone used to yield [["g\tp"]]
  assert.deepEqual(parseKeys("g\tp"), want);
  assert.deepEqual(parseKeys("g\np"), want);
  assert.deepEqual(parseKeys("Ctrl+K\n\np"), [["Ctrl", "K"], ["p"]]);
});

test("a dangling joiner is dropped, not rendered as an empty cap", () => {
  assert.deepEqual(parseKeys("Ctrl+"), [["Ctrl"]]);
  assert.deepEqual(parseKeys("a+"), [["a"]]);
  assert.deepEqual(parseKeys("+K"), [["K"]]); // leading, same rule
});

test("a lone + is the plus KEY, not a joiner", () => {
  assert.deepEqual(parseKeys("+"), [["+"]]);
  assert.deepEqual(parseKeys("++"), [["+"]]);
  assert.deepEqual(parseKeys("+++"), [["+"]]);
  assert.deepEqual(parseKeys("g + p"), [["g"], ["+"], ["p"]]);
});

test("a literal + is recovered at ANY position in a chord, not just trailing", () => {
  // the rule is positional-free: an empty slot flanked by two separators is
  // the plus key. Leading and mid-chord used to silently drop it.
  assert.deepEqual(parseKeys("Ctrl++"), [["Ctrl", "+"]]); // trailing
  assert.deepEqual(parseKeys("Ctrl++K"), [["Ctrl", "+", "K"]]); // mid-chord
  assert.deepEqual(parseKeys("++K"), [["+", "K"]]); // leading
  assert.deepEqual(parseKeys("Ctrl+++K"), [["Ctrl", "+", "+", "K"]]);
  assert.equal(describeKeys("Ctrl++K"), "Control plus Plus plus K");
});

test("chords of more than two members", () => {
  assert.deepEqual(parseKeys("Shift+Cmd+P"), [["Shift", "Cmd", "P"]]);
  assert.equal(describeKeys("Shift+Cmd+P"), "Shift plus Command plus P");
});

test("spoken form names keys a screen reader cannot infer from a glyph", () => {
  assert.equal(speakKey("ctrl"), "Control");
  assert.equal(speakKey("⌘"), "Command");
  assert.equal(speakKey("esc"), "Escape");
  assert.equal(speakKey("↑"), "Up arrow");
  assert.equal(speakKey("+"), "Plus");
  // single letters read better upper-cased; longer labels stay as authored
  assert.equal(speakKey("k"), "K");
  assert.equal(speakKey("F12"), "F12");
});

test("spoken form joins chords with 'plus' and sequences with ', then'", () => {
  assert.equal(describeKeys("Ctrl+K"), "Control plus K");
  assert.equal(describeKeys("g p"), "G, then P");
  assert.equal(describeKeys("Ctrl+K p"), "Control plus K, then P");
  assert.equal(describeKeys("up down"), "Up arrow, then Down arrow");
});

// WAI-ARIA defines aria-keyshortcuts as a space-separated list of ALTERNATIVE
// combinations pressed simultaneously — space means "or" there, but "then" in
// our syntax. So the component emits the attribute only when parseKeys yields
// exactly one step. This pins the predicate that decision rests on.
test("only a single-step binding is expressible in aria-keyshortcuts", () => {
  const emittable = (k) => parseKeys(k).length === 1;
  assert.equal(emittable("Ctrl+K"), true); // a chord IS a valid ARIA value
  assert.equal(emittable("esc"), true);
  assert.equal(emittable("g p"), false); // would read as "g OR p"
  assert.equal(emittable("Ctrl+K p"), false); // would read as "Ctrl+K OR p"
  assert.equal(emittable(""), false); // nothing to assert
});

test("the emitted aria-keyshortcuts value is the reparsed chord, not the raw string", () => {
  // forgiving input must not leak malformed ARIA into the attribute
  const value = (k) => {
    const s = parseKeys(k);
    return s.length === 1 ? s[0].join("+") : undefined;
  };
  assert.equal(value("Ctrl+K"), "Ctrl+K");
  assert.equal(value(" Ctrl+K "), "Ctrl+K");
  assert.equal(value("Ctrl+"), "Ctrl"); // dangling joiner not passed through
  assert.equal(value("g p"), undefined);
});

test("the two joins are distinguishable in the spoken form, not just visually", () => {
  // this is the accessibility half of the chord/sequence distinction: if these
  // ever collided, a screen-reader user could not tell a chord from a sequence.
  assert.notEqual(describeKeys("Ctrl+K"), describeKeys("Ctrl K"));
  assert.equal(describeKeys("Ctrl K"), "Control, then K");
});
