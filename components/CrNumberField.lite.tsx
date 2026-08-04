import { useStore } from "@builder.io/mitosis";

export interface CrNumberFieldProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  onChange?: (value: number) => void;
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
    <div class="cr-numberfield">
      <button
        type="button"
        class="cr-numberfield__btn"
        aria-label="Decrease"
        disabled={props.disabled || state.atMin()}
        onClick={() => state.bump(-1)}
      >
        −
      </button>
      <input
        type="number"
        class="cr-numberfield__input"
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step || 1}
        disabled={props.disabled}
        aria-label={props.label || "number"}
        onInput={(event) => state.onInput((event.target as HTMLInputElement).value)}
      />
      <button
        type="button"
        class="cr-numberfield__btn"
        aria-label="Increase"
        disabled={props.disabled || state.atMax()}
        onClick={() => state.bump(1)}
      >
        +
      </button>
    </div>
  );
}
