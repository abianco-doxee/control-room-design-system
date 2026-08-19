import { For, useStore, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHooks, ptHandler } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";
/* A bare native select. Pair with CrField for a *visible* label; standalone, pass
 * `label` for an accessible name (maps to aria-label) so it is never unnamed.
 *
 * POPUP STYLING IS LIMITED BY THE PLATFORM, NOT BY THIS COMPONENT. The closed
 * control is fully themed, but the open option list is drawn by the OS, outside
 * the page's CSS box — it cannot take our border, shadow, radius, font, padding,
 * or hover colour, and no amount of CSS here will change that. We style the one
 * thing that *is* honoured — `option` background/colour (see `.cr-select option`
 * in components.css) — which Chromium and Firefox on Windows/Linux respect, and
 * which macOS and iOS ignore entirely. Expect the native look on Apple platforms.
 *
 * Matching CrMenu's panel exactly would mean replacing the native element with a
 * custom listbox, which is deliberately NOT done here: the native select is what
 * gives us mobile wheel pickers, keyboard type-ahead, and correct screen-reader
 * semantics for free. If a design ever truly requires a styled popup, build it as
 * a separate opt-in component (CrCombobox is the closest existing one) rather
 * than regressing this one's accessibility. */
export interface CrSelectProps {
  id?: string;
  /** The choices. A bare string is both the value and the label; pass
   *  `{ value, label }` where the two differ — a stored key with readable copy. */
  options: (string | { value: string; label: string })[];
  /** The selected value, for a controlled select. */
  value?: string;
  label?: string;
  disabled?: boolean;
  /** Fires with the newly selected value. */
  onChange?: (value: string) => void;
  /** Marks the control invalid for assistive tech (sets aria-invalid). Visual
   *  error styling comes from a wrapping CrField — this is the a11y half only. */
  invalid?: boolean;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "option". */
  unstyled?: boolean;
  pt?: CrPassThrough<"option" | "root">;
  dt?: CrDesignTokens;
}
export default function CrSelect(props: CrSelectProps) {
  const cr = useContext(CrContext);

  /* Normalised OUTSIDE the template on purpose: a `typeof` test inside the JSX
   * makes the Angular generator emit a broken `useTypeOf` helper, so the
   * component fails to compile on that target. */
  const state = useStore({
    items() {
      const out: { value: string; label: string }[] = [];
      for (const opt of props.options) {
        if (typeof opt === "string") out.push({ value: opt, label: opt });
        else out.push({ value: opt.value, label: opt.label });
      }
      return out;
    },
  });

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrSelect"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrSelect"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrSelect"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  return (
    <select
      {...ptAttrs(ptResolve(cr, props.pt, "CrSelect"), "root")}
      id={props.id}
      class={ptClass(ptResolve(cr, props.pt, "CrSelect"), props.unstyled, "cr-select", "root")}
      data-part="root"
      style={ptStyle(ptResolve(cr, props.pt, "CrSelect"), props.dt, "root")}
      aria-label={props.label}
      disabled={props.disabled}
      aria-invalid={props.invalid ? "true" : "false"}
      data-state={props.invalid ? "invalid" : "valid"}
      value={props.value}
      onChange={(event: any) => { ptHandler(ptResolve(cr, props.pt, 'CrSelect'), 'root', 'onChange', event); props.onChange && props.onChange(event.target.value); }}
    >
      <For each={state.items()}>{(opt: any) => <option {...ptAttrs(ptResolve(cr, props.pt, "CrSelect"), "option")} data-part="option" value={opt.value}>{opt.label}</option>}</For>
    </select>
  );
}
