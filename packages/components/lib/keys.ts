/* Key-binding notation shared by the key-hint components. Pure functions of a
 * string — no reactivity, no framework primitives — so they compile and ship
 * uniformly across all six targets (same rule as lib/pt.ts).
 *
 * THE NOTATION, which readers already know from editors and docs:
 *   "+"   joins a CHORD    — keys pressed together     → "Ctrl+K"
 *   " "   joins a SEQUENCE — keys pressed in order     → "g p"
 *   both  combine                                       → "Ctrl+K p"
 *
 * `parseKeys` returns sequence steps, each an array of chord members:
 *   "Ctrl+K p"  →  [["Ctrl", "K"], ["p"]]
 * `describeKeys` returns the spoken form for an accessible label:
 *   "Ctrl+K p"  →  "Control plus K, then P" */

/** Spoken names for keys whose glyph or abbreviation does not read aloud well.
 *  Looked up case-insensitively; anything absent is spoken as authored. */
const SPOKEN: { [k: string]: string } = {
  ctrl: "Control",
  control: "Control",
  "^": "Control",
  alt: "Alt",
  opt: "Option",
  option: "Option",
  "⌥": "Option",
  cmd: "Command",
  command: "Command",
  meta: "Command",
  "⌘": "Command",
  super: "Super",
  win: "Windows",
  shift: "Shift",
  "⇧": "Shift",
  esc: "Escape",
  escape: "Escape",
  enter: "Enter",
  "↵": "Enter",
  ret: "Return",
  return: "Return",
  del: "Delete",
  delete: "Delete",
  ins: "Insert",
  backspace: "Backspace",
  "⌫": "Backspace",
  tab: "Tab",
  space: "Space",
  spacebar: "Space",
  up: "Up arrow",
  down: "Down arrow",
  left: "Left arrow",
  right: "Right arrow",
  "↑": "Up arrow",
  "↓": "Down arrow",
  "←": "Left arrow",
  "→": "Right arrow",
  pgup: "Page Up",
  pgdn: "Page Down",
  home: "Home",
  end: "End",
  "+": "Plus",
};

/** Parse a binding into sequence steps of chord members.
 *
 *  Steps split on ANY whitespace run, so a stray tab or newline in authored
 *  markup reads as a sequence break rather than becoming part of a key name.
 *
 *  The literal PLUS KEY. Splitting a chord on "+" turns a literal plus into an
 *  empty slot, and the rule is positional-free: an empty slot BETWEEN two
 *  separators is a literal "+", at any position. "Ctrl++K" splits to
 *  ["Ctrl","","K"] — the middle empty is flanked by two "+" so it is the key.
 *  A leading or trailing empty has a separator on one side only, so it is a
 *  dangling joiner and is dropped.
 *
 *  Edge cases, none of which throw or emit an empty keycap:
 *   ""          → []                 (nothing to render)
 *   "   "       → []                 (whitespace only)
 *   "g   p"     → [["g"],["p"]]      (runs of whitespace collapse)
 *   " g p "     → [["g"],["p"]]      (leading/trailing whitespace ignored)
 *   "g\tp"      → [["g"],["p"]]      (any whitespace splits a sequence)
 *   "Ctrl+"     → [["Ctrl"]]         (dangling joiner, dropped)
 *   "+K"        → [["K"]]            (dangling joiner, dropped)
 *   "+"         → [["+"]]            (a lone "+" is the plus key)
 *   "Ctrl++"    → [["Ctrl","+"]]     (trailing literal plus)
 *   "Ctrl++K"   → [["Ctrl","+","K"]] (mid-chord literal plus)
 *   "++"        → [["+"]]            (a step of only "+" is the one plus key)
 *   "+++"       → [["+"]]            (likewise — nothing for it to join) */
export function parseKeys(keys: string): string[][] {
  const src = typeof keys === "string" ? keys : "";
  const steps: string[][] = [];
  const raw = src.split(/\s+/);
  for (let i = 0; i < raw.length; i++) {
    const stepSrc = raw[i];
    if (!stepSrc) continue;
    /* a step made only of "+" is the plus key itself: there is no other key it
       could be joining, so every separator reading is vacuous. "+" and "++" and
       "+++" all mean the one key. */
    if (/^\++$/.test(stepSrc)) {
      steps.push(["+"]);
      continue;
    }
    const members: string[] = [];
    const parts = stepSrc.split("+");
    for (let j = 0; j < parts.length; j++) {
      const p = parts[j].trim();
      if (p) {
        members.push(p);
      } else if (j > 0 && j < parts.length - 1) {
        /* an empty slot flanked by two separators is the literal plus key */
        members.push("+");
      }
    }
    if (members.length > 0) steps.push(members);
  }
  return steps;
}

/** The spoken form of one key, e.g. "ctrl" → "Control", "k" → "K". */
export function speakKey(key: string): string {
  const k = typeof key === "string" ? key.trim() : "";
  if (!k) return "";
  const hit = SPOKEN[k.toLowerCase()];
  if (hit) return hit;
  /* Single letters read better upper-cased ("k" → "K"); longer labels are
     announced exactly as the author wrote them. */
  return k.length === 1 ? k.toUpperCase() : k;
}

/** The spoken form of a whole binding, for an aria-label.
 *   "Ctrl+K"    → "Control plus K"
 *   "g p"       → "G, then P"
 *   "Ctrl+K p"  → "Control plus K, then P"
 *   ""          → "" */
export function describeKeys(keys: string): string {
  const steps = parseKeys(keys);
  const spokenSteps: string[] = [];
  for (let i = 0; i < steps.length; i++) {
    const members: string[] = [];
    for (let j = 0; j < steps[i].length; j++) members.push(speakKey(steps[i][j]));
    spokenSteps.push(members.join(" plus "));
  }
  return spokenSteps.join(", then ");
}
