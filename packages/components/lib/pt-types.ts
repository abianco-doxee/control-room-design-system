/* Public types for the pass-through (`pt`) / design-token (`dt`) styling contract.
 *
 * Deliberately framework-agnostic: these are copied verbatim into every target's
 * `index.d.ts` by build/build-pkg-types.mjs, so they must not reference React's
 * JSX namespace, Vue's `StyleValue`, or any other per-framework type. Plain
 * structural TypeScript only.
 *
 * Why this exists: PrimeVue types its pass-through sections as `any` (and `hooks`
 * as `any`), so a typo in a part name or a handler name is silent — their docs note
 * an IDE extension is "being planned" to cover the gap. Because every Control Room
 * component enumerates its own parts, we can name them in the type instead, and get
 * autocomplete plus a real compile error on a typo. See references/styling-contract.md. */

/** A style object. Custom properties (`--cr-*`) are the common case, so the index
 *  signature is permissive rather than a fixed CSS-property union. */
export interface CrStyle {
  [property: string]: string | number | undefined;
}

/** Design tokens applied to a component's root and inherited by its parts.
 *  Keys are CSS custom properties: `{ "--cr-tabs-indicator": "oklch(0.7 0.2 320)" }`. */
export interface CrDesignTokens {
  [cssVariable: string]: string | number | undefined;
}

/** Lifecycle callbacks for one component instance, PrimeVue-shaped.
 *
 *  Only the three that map cleanly onto all six targets are exposed. PrimeVue also
 *  lists onBeforeCreate/onCreated/onBeforeMount/onBeforeUpdate/onBeforeUnmount;
 *  those have no faithful equivalent across React/Solid/Qwik/Svelte/Vue/Angular
 *  together, so they are omitted rather than emulated inconsistently. */
export interface CrHooks {
  onMounted?: () => void;
  onUpdated?: () => void;
  onUnmounted?: () => void;
}

/** One pass-through section — the props applied to a single named part.
 *
 *  - `class` is MERGED with the component's own class, never replaced.
 *  - `style` is applied to the part.
 *  - `on*` handlers are CHAINED with the component's own: both run, consumer first
 *    (see ptHandler in lib/pt.ts). They are delivered by the component, not spread,
 *    which is what makes chaining work identically on all six targets.
 *  - any other key is spread onto the part as a DOM attribute (`data-*`, `aria-*`,
 *    `id`, `title`, …).
 *
 *  The handler signature is `(event: any) => void` on purpose: the DOM event type
 *  differs per framework (React's SyntheticEvent vs a native Event), and this type
 *  is shared by all six. Narrow it at the call site if you need to. */
export interface CrPTSection {
  class?: string;
  style?: CrStyle;
  [attributeOrHandler: string]: any;
}

/** The `pt` object for a component: one section per named part.
 *
 *  Components narrow `Part` to their own part names, so
 *  `CrPassThrough<"root" | "tab">` gives autocomplete on the two valid parts and a
 *  compile error on `{ tabb: … }`. `hooks` is reserved and never reaches the DOM. */
export type CrPassThrough<Part extends string = string> = {
  [K in Part]?: CrPTSection;
} & {
  /** Component-level lifecycle callbacks. Never spread onto an element. */
  hooks?: CrHooks;
};

/** App-level defaults for the whole library — the GLOBAL tier of the resolution
 *  chain (global → component), provided once through `CrContext`.
 *
 *  `pt` is keyed by COMPONENT NAME, and each value is that component's own `pt`
 *  object, so the part names are per component:
 *
 *    { pt: { CrTabs: { tab: { class: "px-3" } }, CrModal: { hooks: { onMounted } } } }
 *
 *  Deliberately `CrPassThrough` (loose `Part`) per component rather than a mapped
 *  type over every component's own union: the union lives in each component's own
 *  declaration, and this type is inlined into all six targets' `index.d.ts` without
 *  them. A typo in a part name here is therefore NOT a compile error, unlike the
 *  per-instance `pt` prop — the trade that keeps this one type framework-agnostic. */
export interface CrGlobalConfig {
  /** Per-component-type pass-through defaults, keyed by component name. */
  pt?: Record<string, CrPassThrough>;
  /** BCP-47 tag for Intl formatting (dates, numbers, relative time). Explicit,
   *  never navigator.language — see the SSR note in references/styling-contract.md. */
  locale?: string;
  /** Overrides for the UI copy Intl cannot derive, keyed "<Component>.<key>":
   *  `{ "CrModal.close": "Chiudi" }`. A value may be a function of one argument
   *  for the counted/interpolated keys, matching the built-in's shape. */
  messages?: Record<string, string | ((value: any) => string)>;
}
