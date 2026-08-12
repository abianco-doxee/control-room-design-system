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
 *  Edge cases, all of which must not throw and must not emit empty keycaps:
 *   ""          → []            (nothing to render)
 *   "   "       → []            (whitespace only)
 *   "g   p"     → [["g"],["p"]] (runs of space collapse)
 *   " g p "     → [["g"],["p"]] (leading/trailing space ignored)
 *   "Ctrl++"    → [["Ctrl","+"]](a trailing "+" is the PLUS KEY, not a dangling joiner)
 *   "+"         → [["+"]]       (a lone "+" is the plus key)
 *   "Ctrl+"     → [["Ctrl"]]    (a dangling joiner with nothing after it is dropped) */
export function parseKeys(keys: string): string[][] {
  const src = typeof keys === "string" ? keys : "";
  const steps: string[][] = [];
  const raw = src.split(" ");
  for (let i = 0; i < raw.length; i++) {
    const stepSrc = raw[i].trim();
    if (!stepSrc) continue;
    /* A step that is only "+" characters is the plus key itself, not a joiner. */
    const members: string[] = [];
    const parts = stepSrc.split("+");
    for (let j = 0; j < parts.length; j++) {
      const p = parts[j].trim();
      if (p) {
        members.push(p);
      } else if (j > 0 && j === parts.length - 1 && members.length > 0) {
        /* "Ctrl++" → parts ["Ctrl","",""]: the final empty slot means the last
           "+" was a literal key, not a separator. Only claim it once. */
        if (parts[j - 1] === "") members.push("+");
      }
    }
    /* "+" alone → parts ["",""] → nothing collected above; it is the plus key. */
    if (members.length === 0 && stepSrc.indexOf("+") !== -1) members.push("+");
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
