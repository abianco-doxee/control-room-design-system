import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrCheckboxProps {
  id?: string;
  name?: string;
  /** Controlled checked state. */
  checked?: boolean;
  /** Neither on nor off — a partially-selected parent (e.g. a select-all header
   *  over a partly-selected list). Sets `aria-checked="mixed"`; the DOM
   *  `indeterminate` flag is a property, not an attribute, so callers that need
   *  the native tri-state paint should set it on the ref. */
  indeterminate?: boolean;
  disabled?: boolean;
  /** Accessible name. Required when no visible <label> points at this control —
   *  a checkbox with no name is unusable with a screen reader. */
  label?: string;
  onChange?: (checked: boolean) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Single part: "root" (the input itself). */
  unstyled?: boolean;
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}

/* The Control Room checkbox — one implementation of the box that CrTable,
 * CrDataGrid, CrFormRow and CrChoice previously each hand-rolled as a bare
 * `<input type="checkbox" class="cr-check">`.
 *
 * It renders the INPUT only (no wrapping label), because every call site frames it
 * differently: a table cell, a form row with its own label element, a choice list.
 * `.cr-check` styling and the `--cr-check-*` tokens are unchanged, so extracting it
 * is visually inert.
 *
 * As a nested component it is reachable through the parent's `pt` — e.g.
 * `pt={{ check: { root: { "data-testid": "row-select" } } }}` on CrTable — which is
 * what the bare inline input could never offer. */
export default function CrCheckbox(props: CrCheckboxProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onMounted) props.pt.hooks.onMounted();
  });
  onUpdate(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUpdated) props.pt.hooks.onUpdated();
  }, []);
  onUnMount(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUnmounted) props.pt.hooks.onUnmounted();
  });

  return (
    <input
      {...ptAttrs(ptResolve(cr, props.pt, "CrCheckbox"), "root")}
      type="checkbox"
      data-part="root"
      data-state={props.indeterminate ? "mixed" : props.checked ? "on" : "off"}
      id={props.id}
      name={props.name}
      class={ptClass(ptResolve(cr, props.pt, "CrCheckbox"), props.unstyled, "cr-check", "root")}
      style={ptStyle(ptResolve(cr, props.pt, "CrCheckbox"), props.dt, "root")}
      checked={props.checked}
      disabled={props.disabled}
      aria-label={props.label}
      aria-checked={props.indeterminate ? "mixed" : undefined}
      onChange={(event) => {
        ptHandler(ptResolve(cr, props.pt, 'CrCheckbox'), 'root', 'onChange', event);
        if (props.onChange) props.onChange((event.target as HTMLInputElement).checked);
      }}
    />
  );
}
