import { useStore, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler, resolveMessage } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrNumberFieldProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  /** Marks the control invalid for assistive tech (sets aria-invalid). Visual
   *  error styling comes from a wrapping CrField — this is the a11y half only. */
  invalid?: boolean;
  onChange?: (value: number) => void;
  /** Override this component's built-in English strings. Any key you omit falls
   *  back to the app-level `messages` from context, then to the built-in default.
   *  See lib/messages.ts for the keys. */
  labels?: Record<string, any>;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "btn" · "input". */
  unstyled?: boolean;
  pt?: CrPassThrough<"btn" | "input" | "root">;
  dt?: CrDesignTokens;
}

/* Number input with −/+ steppers, clamped to min/max. The native input keeps its
 * own keyboard (arrows); the buttons step by `step`. Styling via .cr-numberfield. */
export default function CrNumberField(props: CrNumberFieldProps) {
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
    clampVal(n: number): number {
      let v = n;
      if (props.min != null && v < props.min) v = props.min;
      if (props.max != null && v > props.max) v = props.max;
      return v;
    },
    bump(dir: number) {
      const next = state.clampVal((props.value || 0) + dir * (props.step || 1));
      if (props.onChange) props.onChange(next);
    },
    onInput(raw: string) {
      const n = Number(raw);
      if (!isNaN(n) && props.onChange) props.onChange(state.clampVal(n));
    },
    atMin(): boolean {
      return props.min != null && (props.value || 0) <= props.min;
    },
    atMax(): boolean {
      return props.max != null && (props.value || 0) >= props.max;
    },
  });

  return (
    <div
      {...ptAttrs(ptResolve(cr, props.pt, "CrNumberField"), "root")}
      class={ptClass(ptResolve(cr, props.pt, "CrNumberField"), props.unstyled, "cr-numberfield", "root")}
      data-part="root"
      style={ptStyle(ptResolve(cr, props.pt, "CrNumberField"), props.dt, "root")}
    >
      <button
        {...ptAttrs(ptResolve(cr, props.pt, "CrNumberField"), "btn")}
        type="button"
        class={ptClass(ptResolve(cr, props.pt, "CrNumberField"), props.unstyled, "cr-numberfield__btn", "btn")}
        data-part="btn"
        aria-label={resolveMessage(cr, props.labels, "CrNumberField", "decrease")}
        disabled={props.disabled || state.atMin()}
        onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrNumberField'), 'btn', 'onClick', event); state.bump(-1); }}
      >
        −
      </button>
      <input
        {...ptAttrs(ptResolve(cr, props.pt, "CrNumberField"), "input")}
        type="number"
        class={ptClass(ptResolve(cr, props.pt, "CrNumberField"), props.unstyled, "cr-numberfield__input", "input")}
        data-part="input"
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step || 1}
        disabled={props.disabled}
        aria-label={props.label || "number"}
        aria-invalid={props.invalid ? "true" : "false"}
        data-state={props.invalid ? "invalid" : "valid"}
        onInput={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrNumberField'), 'input', 'onInput', event); state.onInput((event.target as HTMLInputElement).value); }}
      />
      <button
        {...ptAttrs(ptResolve(cr, props.pt, "CrNumberField"), "btn")}
        type="button"
        class={ptClass(ptResolve(cr, props.pt, "CrNumberField"), props.unstyled, "cr-numberfield__btn", "btn")}
        data-part="btn"
        aria-label={resolveMessage(cr, props.labels, "CrNumberField", "increase")}
        disabled={props.disabled || state.atMax()}
        onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrNumberField'), 'btn', 'onClick', event); state.bump(1); }}
      >
        +
      </button>
    </div>
  );
}
