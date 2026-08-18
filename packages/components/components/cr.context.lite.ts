import { createContext } from "@builder.io/mitosis";

/* App-level defaults for the whole component library — the "global" tier of the
 * PrimeVue-shaped resolution chain (global → component), plus the localisation
 * cascade.
 *
 * Compiles to each framework's own primitive: React/Solid/Qwik `useContext`, Vue
 * `inject`, Svelte `getContext`, Angular constructor DI. Verified on all six.
 *
 * It lives in `components/` rather than a `context/` folder ON PURPOSE:
 * mitosis.config.cjs globs `components/**`, so a context module anywhere else
 * compiles without error but is never emitted to dist, and consumers get an
 * unresolvable import.
 *
 * Every field defaults to empty/neutral so a component rendered OUTSIDE any
 * provider behaves exactly as it does today — which is also what keeps SSR safe.
 *
 *   pt       per-component-type pass-through defaults, keyed by component name:
 *            { CrTabs: { tab: { class: "px-3" } } }
 *   locale   BCP-47 tag for Intl formatting (dates, numbers, relative time).
 *            Explicit, never navigator.language — see the SSR note in
 *            references/styling-contract.md.
 *   messages override strings for the UI copy Intl cannot derive, keyed
 *            "<component>.<key>": { "pagination.prev": "Precedente" }
 */
export default createContext({
  pt: {} as Record<string, any>,
  locale: "" as string,
  messages: {} as Record<string, string>,
});
