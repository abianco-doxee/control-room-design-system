import { useStore } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

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
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "btn" · "input". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* Number input with −/+ steppers, clamped to min/max. The native input keeps its
 * own keyboard (arrows); the buttons step by `step`. Styling via .cr-numberfield. */
export default function CrNumberField(props: CrNumberFieldProps) {
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
      {...ptAttrs(props.pt, "root")}
      class={ptClass(props.pt, props.unstyled, "cr-numberfield", "root")}
      data-part="root"
      style={ptStyle(props.pt, props.dt, "root")}
    >
      <button
        {...ptAttrs(props.pt, "btn")}
        type="button"
        class={ptClass(props.pt, props.unstyled, "cr-numberfield__btn", "btn")}
        data-part="btn"
        aria-label="Decrease"
        disabled={props.disabled || state.atMin()}
        onClick={() => state.bump(-1)}
      >
        −
      </button>
      <input
        {...ptAttrs(props.pt, "input")}
        type="number"
        class={ptClass(props.pt, props.unstyled, "cr-numberfield__input", "input")}
        data-part="input"
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step || 1}
        disabled={props.disabled}
        aria-label={props.label || "number"}
        aria-invalid={props.invalid ? "true" : "false"}
        data-state={props.invalid ? "invalid" : "valid"}
        onInput={(event) => state.onInput((event.target as HTMLInputElement).value)}
      />
      <button
        {...ptAttrs(props.pt, "btn")}
        type="button"
        class={ptClass(props.pt, props.unstyled, "cr-numberfield__btn", "btn")}
        data-part="btn"
        aria-label="Increase"
        disabled={props.disabled || state.atMax()}
        onClick={() => state.bump(1)}
      >
        +
      </button>
    </div>
  );
}
