import { useStore, For, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import CrChoice from "./CrChoice.lite";
import { ptClass, ptAttrs, ptStyle, ptResolve } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrChoiceOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CrChoiceGroupProps {
  /** "radio" (default) — single choice, one tab stop, arrows move selection.
   *  "checkbox" — multiple choice, each box independently tabbable, arrows inert. */
  type?: "checkbox" | "radio";
  options: CrChoiceOption[];
  /** Selected value — `type="radio"` only (controlled). */
  value?: string;
  /** Selected values — `type="checkbox"` only (controlled). */
  values?: string[];
  /** Shared form name for the radio branch. Auto-generated when omitted; pass an
   *  explicit one when two radio groups must not be confused by the browser. */
  name?: string;
  /** Lay the choices out in a row. */
  row?: boolean;
  label?: string;
  /** Marks the group invalid for assistive tech (sets aria-invalid). Visual error
   *  styling comes from a wrapping CrField — this is the a11y half only. */
  invalid?: boolean;
  disabled?: boolean;
  /** Fires with the new value — `type="radio"` only. */
  onChange?: (value: string) => void;
  /** Fires with the full next selection — `type="checkbox"` only. */
  onChangeMany?: (values: string[]) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "choice". */
  unstyled?: boolean;
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}

/* One grouped-choice control for BOTH types, rendering CrChoice (native inputs)
 * so each type gets the keyboard model its role requires. radio: role=radiogroup,
 * every input shares one `name`, so the BROWSER supplies the roving tabindex (one
 * tab stop) and arrow-key selection. checkbox: role=group, independent inputs,
 * each its own tab stop, arrows inert. Neither branch attaches a key handler.
 * WHY THERE IS NO ROVING-TABINDEX JS (do not add one): a hand-rolled tabbable/
 * onKey pair is only ever needed when the radio role is faked on non-native
 * elements (e.g. a <button role="radio">, which has no native keyboard
 * semantics). Over real <input> elements the platform already does it, so such
 * a handler would be DEAD code here — it would have to query a radio role and
 * a data-value attribute, neither of which CrChoice emits. Native arrow
 * selection also fires change, so onChange still round-trips.
 * Styling via .cr-choicegroup. */
export default function CrChoiceGroup(props: CrChoiceGroupProps) {
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

  const state = useStore({
    /* Stable per-instance fallback name so two radio groups on one page never
     * collide (colliding names would make the browser treat them as ONE group). */
    autoName: "cr-choicegroup-" + Math.random().toString(36).slice(2, 10),
    groupName(): string {
      return props.name || state.autoName;
    },
    isRadio(): boolean {
      return props.type !== "checkbox";
    },
    checkedFor(v: string): boolean {
      if (props.type !== "checkbox") return props.value === v;
      return (props.values || []).indexOf(v) >= 0;
    },
    /* radio: report the picked value. checkbox: report the whole next array. */
    pick(v: string, checked: boolean) {
      if (props.type !== "checkbox") {
        if (checked && props.onChange) props.onChange(v);
        return;
      }
      const cur = props.values || [];
      const next = checked ? cur.concat([v]) : cur.filter((x: string) => x !== v);
      if (props.onChangeMany) props.onChangeMany(next);
    },
  });

  return (
    <div
      {...ptAttrs(ptResolve(cr, props.pt, "CrChoiceGroup"), "root")}
      data-part="root"
      class={ptClass(ptResolve(cr, props.pt, "CrChoiceGroup"), props.unstyled, "cr-choicegroup" + (props.row ? " cr-choicegroup--row" : ""), "root")}
      style={ptStyle(ptResolve(cr, props.pt, "CrChoiceGroup"), props.dt, "root")}
      role={props.type === "checkbox" ? "group" : "radiogroup"}
      aria-label={props.label}
      aria-invalid={props.invalid ? "true" : "false"}
    >
      <For each={props.options}>
        {(opt: CrChoiceOption) => (
          <CrChoice
            {...ptAttrs(ptResolve(cr, props.pt, "CrChoiceGroup"), "choice")}
            type={props.type === "checkbox" ? "checkbox" : "radio"}
            name={state.isRadio() ? state.groupName() : undefined}
            label={opt.label}
            checked={state.checkedFor(opt.value)}
            disabled={props.disabled || opt.disabled}
            invalid={props.invalid}
            unstyled={props.unstyled}
            onChange={(checked: boolean) => state.pick(opt.value, checked)}
          />
        )}
      </For>
    </div>
  );
}
