import { CR_MESSAGES } from "./messages.ts";

/* Pass-through (pt) / design-token (dt) / unstyled styling helpers shared by every
 * component adopting the styling contract (CrTabs, CrMenu, CrModal, …). Pure
 * functions of the component's props — no reactivity, no framework primitives —
 * so they compile and ship uniformly across all six targets. See
 * references/styling-contract.md. */

/** Resolve the effective `pt` for one component from the two tiers, PrimeVue-shaped:
 *  **global (context) → component (`props.pt`)**, component wins.
 *
 *  Merging is per PART, not whole-object: a global `{ tab: { class } }` and a local
 *  `{ tab: { "data-x": 1 } }` both survive on the tab. Within one part the local key
 *  wins, except:
 *    - `class`, which CONCATENATES (global first) so an app-level default class is
 *      not silently dropped by an instance adding one of its own;
 *    - `style`, which MERGES key-wise (local wins per property) for the same
 *      reason — a global `{ "--cr-tabs-gap": … }` must survive an instance that
 *      only sets `opacity`. This matches Vue's own `mergeProps`, which the Vue
 *      CrTabs override uses, so both implementations agree;
 *    - a NESTED SECTION (a plain-object value — a child component's `pt`, see
 *      ptNested), which recurses so the two rules above also hold one level down.
 *      Without the recursion the parent tier would be second-class: a global
 *      `CrTable.check.root.class` would be clobbered by any instance setting
 *      `check.root`.
 *
 *  Call once per component and pass the result to ptClass/ptAttrs/ptStyle/ptHandler:
 *
 *    const pt = ptResolve(cr, props.pt, "CrTabs");
 *
 *  PASS THE CONTEXT OBJECT ITSELF, not `cr.pt` — this function reads `ctx.pt`
 *  internally. Passing `cr.pt` makes `ctx.pt` undefined, so the global tier is
 *  silently skipped and only `props.pt` survives; it fails open, with no error.
 *
 *  The `ctx &&` guard inside is required, not defensive: the CONTEXT OBJECT itself,
 *  not just its fields, is undefined when nothing provides it — Vue's `inject(key)`
 *  with no provider returns undefined, and Svelte's `getContext` behaves the same.
 *  That is the normal case for SSR and for any app that never sets app-level
 *  defaults, which is the whole point of the tier being optional. Such a component
 *  gets `props.pt` back untouched — no behaviour change, no allocation. */
/** True for a plain object — a nested section or a `style`/`hooks` bag, never an
 *  attribute value. Arrays are excluded deliberately: an attribute value is
 *  legitimately a string/number/boolean, and an array is treated as one. */
function isPlainObject(v: any): boolean {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Merge one global section over one local section. Local wins per key, except
 *  `class` (concatenated, global first), and any plain-object value (`style`, a
 *  nested child `pt`), which merges recursively so both rules hold at depth. */
function mergeSection(gp: any, lp: any): any {
  if (!isPlainObject(gp) || !isPlainObject(lp)) return lp;
  const merged: any = {};
  for (const k of Object.keys(gp)) merged[k] = gp[k];
  for (const k of Object.keys(lp)) {
    const gv = gp[k];
    const lv = lp[k];
    merged[k] = isPlainObject(gv) && isPlainObject(lv) ? mergeSection(gv, lv) : lv;
  }
  if (typeof gp.class === "string" && typeof lp.class === "string") {
    merged.class = gp.class + " " + lp.class;
  }
  return merged;
}

export function ptResolve(ctx: any, localPt: any, component: string): any {
  const globalPt = ctx && ctx.pt;
  const g = globalPt && globalPt[component];
  if (!g) return localPt;
  if (!localPt) return g;
  const out: any = {};
  for (const part of Object.keys(g)) out[part] = g[part];
  for (const part of Object.keys(localPt)) out[part] = mergeSection(out[part], localPt[part]);
  return out;
}

/** Resolve the active locale: `props.locale` → context → `"en"`.
 *  Per-component, not global-only — a mixed-locale screen (Italian chrome, an
 *  en-GB compliance table) is a real requirement, and `pt`/`messages` both resolve
 *  component-over-global, so locale must match or it is the one odd knob. */
export function resolveLocale(localLocale: any, globalLocale: any): string {
  return localLocale || globalLocale || "en";
}

/** Resolve one UI string: `props.labels[key]` → context `messages["<comp>.<key>"]`
 *  → the component's built-in English default.
 *
 *  Same precedence as `pt`, so the whole library has one mental model. Used only
 *  for copy `Intl` cannot derive (button labels, accessible names); anything
 *  derivable — month names, relative time — comes from `Intl` keyed on the
 *  resolved locale instead.
 *
 *  Every lookup is an OWN-PROPERTY read. A plain `obj[key]` finds inherited
 *  members, and since the result is then type-tested and CALLED, a key named
 *  `toString` would render "[object Undefined]" and `valueOf`/`hasOwnProperty`
 *  would throw. Reserved names are legitimate UI keys, so the guard is required.
 *
 *  A consumer override REPLACES the built-in only when its shape can carry the
 *  same information: overriding a function-valued message (`page`, `digit`, …)
 *  with a plain string would silently drop the interpolated value — "Pagina" on
 *  every page, no number, no error. Such an override is ignored in favour of the
 *  built-in, and reported once via console.error so it is fixable. */
function own(obj: any, key: string): any {
  return obj && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
}

export function resolveMessage(
  ctx: any,
  labels: any,
  component: string,
  key: string,
  arg?: any
): string {
  const global = ctx && own(ctx.messages, component + "." + key);
  const builtIn = own(own(CR_MESSAGES, component), key);
  let picked = own(labels, key) ?? global ?? builtIn;
  // An override that cannot carry the built-in's interpolation is not usable.
  if (typeof builtIn === "function" && typeof picked === "string") {
    if (typeof console !== "undefined" && console.error) {
      console.error(
        `[control-room] ${component}.${key} takes a value, so it must be overridden with ` +
          `a function (e.g. (n) => \`…\${n}…\`), not the string ${JSON.stringify(picked)}. ` +
          `Ignoring the override.`
      );
    }
    picked = builtIn;
  }
  if (typeof picked === "function") return picked(arg);
  if (typeof picked === "string") return picked;
  // A missing key is a bug in the component, not in the consumer's config — return
  // the key itself so it is visible in the UI rather than rendering "undefined".
  return key;
}

/** base class gated by `unstyled`, with the part's pt class merged in. */
export function ptClass(pt: any, unstyled: boolean, base: string, part: string): string {
  const p = pt && pt[part];
  return ((unstyled ? "" : base) + (p && p.class ? " " + p.class : "")).trim();
}

/** Keys that are NEVER spread onto a DOM element. `hooks` is PrimeVue-shaped
 *  component-level lifecycle (read by the component, invoked in its own lifecycle);
 *  spreading it would emit `hooks="[object Object]"` as an attribute. Nested
 *  component sections are excluded the same way — their value is a `pt` object for
 *  a child component, not an attribute bag.
 *
 *  `pt`/`dt`/`unstyled`/`labels`/`locale` are the component's own sibling props, and
 *  nesting one inside a section by mistake (`pt={{ root: { unstyled: true } }}`
 *  instead of `unstyled`) is an easy confusion the type system invites, since
 *  CrPTSection's index signature accepts any key. The plain-object filter below
 *  already catches them when they hold an object; listing them here catches the
 *  scalar forms too, which would otherwise render as invalid DOM attributes. */
const RESERVED = ["hooks", "pt", "dt", "unstyled", "labels", "locale"];

/** The component-level lifecycle callbacks from a RESOLVED `pt`, or undefined.
 *
 *  Takes the resolved `pt` rather than `props.pt` so app-level hooks work: the
 *  global tier is the natural place to hang instrumentation across a whole library
 *  ("time every modal open"), and reading `props.pt.hooks` directly — as every
 *  component did originally — made that silently do nothing.
 *
 *  A helper rather than an inline `pt && pt.hooks` at 213 call sites because it is
 *  the one place the reserved-key contract and the cascade have to agree; see
 *  RESERVED, which keeps `hooks` from ever reaching the DOM. */
export function ptHooks(pt: any): any {
  return pt && pt.hooks;
}

/** Forward a parent's `pt` section down to a NESTED component — PrimeVue's parent
 *  tier (their `pcBadge` convention), which is what makes an inner component
 *  reachable at all:
 *
 *    <CrTable pt={{ check: { root: { "data-testid": "row-select" } } }} />
 *    // …inside CrTable:
 *    <CrCheckbox pt={ptNested(pt, "check")} />
 *
 *  The section's value is a `pt` OBJECT for the child (parts of the child), not an
 *  attribute bag for an element — which is exactly why such sections must never be
 *  spread onto the DOM. `ptAttrs` drops any key whose value is a plain object for
 *  that reason, so a nested section cannot leak out as `check="[object Object]"`.
 *
 *  Returns undefined when the parent said nothing, so the child sees no `pt` at all
 *  rather than an empty object. */
export function ptNested(pt: any, part: string): any {
  const p = pt && pt[part];
  return p && typeof p === "object" ? p : undefined;
}

/** True for any `on…`-prefixed key, in either the JSX convention Mitosis emits for
 *  React/Solid/Qwik (`onClick`, `onKeyDown`, `onClick$`) or the lowercase HTML
 *  spelling (`onbeforeinput`).
 *
 *  BOTH spellings are stripped, because Angular is the constraint. Its generated
 *  `setAttributes` shim branches on `key.startsWith('on')` — case-insensitively in
 *  effect — and routes every match to `renderer.listen(el, key.replace('on',''), …)`.
 *  So a lowercase `onbeforeinput` left in the spread becomes a real event listener
 *  registered with whatever the value is (a string, typically), which is a second
 *  delivery path on exactly one target. Stripping both spellings here is what makes
 *  "one delivery path, same behaviour everywhere" true rather than aspirational.
 *
 *  The cost is that a lowercase `on*` key can no longer be set as a literal DOM
 *  ATTRIBUTE through `pt`. That is the right trade: an inline-handler attribute is
 *  not something this library should help emit (it is a CSP violation waiting to
 *  happen), and `ptHandler` is the supported way to observe an event.
 *
 *  Only a FUNCTION value is treated as a handler for the lowercase spelling, so a
 *  `data`-ish key that merely starts with "on" and carries a string is unaffected;
 *  the uppercase JSX spelling is stripped regardless of value, since it can never
 *  be a valid attribute name. `only`/`once` are excluded either way: an event name
 *  must follow the prefix, and neither has a function value. */
function isHandlerKey(key: string, value?: any): boolean {
  if (key.length < 3) return false;
  if (key.charAt(0) !== "o" || key.charAt(1) !== "n") return false;
  const c = key.charAt(2);
  if (c >= "A" && c <= "Z") return true;
  // Lowercase `on…`: a handler only if it actually carries a function. Angular
  // would `listen()` on a string too, but such a value is inert on every target,
  // and keeping it spreadable preserves the documented attribute escape hatch.
  return typeof value === "function";
}

/** Invoke a consumer's `pt` handler for one part/event. The component calls this
 *  from inside its OWN handler, which stays in JSX — that ordering is what makes
 *  chaining portable across all six targets from a single source:
 *
 *    onClick={(event) => state.onTabClick(event, i)}   // JSX: bound natively
 *    // …and inside onTabClick:
 *    ptHandler(props.pt, "tab", "onClick", event);     // consumer runs first
 *    state.select(i);                                   // component runs second
 *
 *  WHY NOT MERGE INTO THE SPREAD. The obvious design — compose the two functions
 *  and let `ptAttrs` return the composite — works on React/Solid/Qwik but breaks
 *  Svelte. Verified against svelte 4.2: `on:click={fn}` compiles to a real
 *  `listen()` call, whereas a spread `{...{onClick: fn}}` compiles to
 *  `set_attributes` with NO listener at all — the handler becomes a dead DOM
 *  attribute and the component's behaviour silently disappears. Keeping the
 *  component's handler in JSX sidesteps that entirely.
 *
 *  Consumer-first is deliberate: the consumer observes the event before the
 *  component mutates state, and a consumer calling `preventDefault()` is visible
 *  to the component's handler. A throwing consumer must not strand the component,
 *  so the call is guarded.
 *
 *  Returns true if a consumer handler ran (useful when a component wants to know
 *  whether to skip a default). */
export function ptHandler(pt: any, part: string, event: string, ...args: any[]): boolean {
  const p = pt && pt[part];
  const fn = p && p[event];
  if (typeof fn !== "function") return false;
  try {
    fn(...args);
  } catch (err) {
    // A consumer's analytics call must never break the component's own behaviour.
    if (typeof console !== "undefined" && console.error) console.error(err);
  }
  return true;
}

/** the part's pt bag minus class/style/reserved/handlers — spread onto the element
 *  as extra attributes (class + style are applied separately).
 *
 *  Handlers are stripped here ON PURPOSE. They are delivered by `ptHandler()` from
 *  inside the component's own handler instead, so they cannot also arrive through
 *  the spread — which would double-fire on the targets that do bind spread events
 *  (React/Solid/Qwik) and land as a dead attribute on the ones that don't
 *  (Svelte 4). One delivery path, same behaviour everywhere. */
export function ptAttrs(pt: any, part: string): any {
  const p = pt && pt[part];
  if (!p) return {};
  const out: any = {};
  for (const key of Object.keys(p)) {
    if (key === "class" || key === "style") continue;
    if (RESERVED.indexOf(key) !== -1) continue;
    const v = p[key];
    if (isHandlerKey(key, v)) continue;
    // A plain-object value is a NESTED COMPONENT section (a `pt` for a child, see
    // ptNested), never an attribute — spreading it would emit
    // `check="[object Object]"`. Arrays and other exotics still pass through, since
    // an attribute value is legitimately a string/number/boolean.
    if (isPlainObject(v)) continue;
    out[key] = v;
  }
  return out;
}

/** part style: dt custom-properties on the root part, plus any pt style.
 *
 *  Only an OBJECT `style` is spread. `CrPTSection`'s index signature makes
 *  `style: "color:red"` type-check in some positions, and every non-TSX target
 *  (Vue/Svelte/Angular) has no checking on `pt` values at all — spreading a string
 *  would char-index it into `{0:"c",1:"o",…}` and render garbage inline style. A
 *  string is dropped rather than mangled; `ptAttrs` already skips `style` entirely,
 *  so there is no second path that would emit it. */
export function ptStyle(pt: any, dt: any, part: string): any {
  const p = pt && pt[part];
  const base = part === "root" ? dt || {} : {};
  const style = p && p.style;
  return { ...base, ...(isPlainObject(style) ? style : {}) };
}
