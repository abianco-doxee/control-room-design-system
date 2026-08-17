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
 *  wins, except `class`, which CONCATENATES (global first) so an app-level default
 *  class is not silently dropped by an instance adding one of its own.
 *
 *  Call once per component and pass the result to ptClass/ptAttrs/ptStyle/ptHandler:
 *
 *    const pt = ptResolve(cr.pt, props.pt, "CrTabs");
 *
 *  A component rendered outside any provider gets `cr.pt` undefined and this
 *  returns `props.pt` untouched — no behaviour change, no allocation.
 *
 *  Call it as `ptResolve(cr && cr.pt, …)`. The CONTEXT OBJECT itself, not just its
 *  fields, is undefined when nothing provides it: Vue's `inject(key)` with no
 *  provider returns undefined, and Svelte's `getContext` behaves the same, so a
 *  bare `cr.pt` throws "Cannot read properties of undefined". That is the normal
 *  case for SSR and for any app that never sets app-level defaults — the whole
 *  point of the tier being optional — so the guard is required, not defensive. */
export function ptResolve(ctx: any, localPt: any, component: string): any {
  const globalPt = ctx && ctx.pt;
  const g = globalPt && globalPt[component];
  if (!g) return localPt;
  if (!localPt) return g;
  const out: any = {};
  for (const part of Object.keys(g)) out[part] = g[part];
  for (const part of Object.keys(localPt)) {
    const gp = out[part];
    const lp = localPt[part];
    if (!gp || !lp || typeof gp !== "object" || typeof lp !== "object") {
      out[part] = lp;
      continue;
    }
    const merged: any = {};
    for (const k of Object.keys(gp)) merged[k] = gp[k];
    for (const k of Object.keys(lp)) merged[k] = lp[k];
    if (gp.class && lp.class) merged.class = gp.class + " " + lp.class;
    out[part] = merged;
  }
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
 *  resolved locale instead. */
export function resolveMessage(
  ctx: any,
  labels: any,
  component: string,
  key: string,
  arg?: any
): string {
  const global = ctx && ctx.messages && ctx.messages[component + "." + key];
  const builtIn = CR_MESSAGES[component] && CR_MESSAGES[component][key];
  const picked = (labels && labels[key]) ?? global ?? builtIn;
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
 *  a child component, not an attribute bag. */
const RESERVED = ["hooks"];

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

/** True for an event-handler key in the JSX convention Mitosis emits for
 *  React/Solid/Qwik (`onClick`, `onKeyDown`, `onClick$`). Deliberately requires an
 *  uppercase 3rd char so `onbeforeinput`-style lowercase HTML attributes and a
 *  stray `only`/`once` key are not mistaken for handlers. */
function isHandlerKey(key: string): boolean {
  if (key.length < 3) return false;
  if (key.charAt(0) !== "o" || key.charAt(1) !== "n") return false;
  const c = key.charAt(2);
  return c >= "A" && c <= "Z";
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
    if (isHandlerKey(key)) continue;
    // A plain-object value is a NESTED COMPONENT section (a `pt` for a child, see
    // ptNested), never an attribute — spreading it would emit
    // `check="[object Object]"`. Arrays and other exotics still pass through, since
    // an attribute value is legitimately a string/number/boolean.
    const v = p[key];
    if (v && typeof v === "object" && !Array.isArray(v)) continue;
    out[key] = v;
  }
  return out;
}

/** part style: dt custom-properties on the root part, plus any pt style. */
export function ptStyle(pt: any, dt: any, part: string): any {
  const p = pt && pt[part];
  const base = part === "root" ? dt || {} : {};
  return { ...base, ...(p && p.style ? p.style : {}) };
}
