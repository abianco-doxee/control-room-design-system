import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  onChange?: (value: number) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* A styled native range input — square track + thumb, keyboard for free (arrows,
 * Home/End, PageUp/Down). Styling via .cr-slider. */
export default function CrSlider(props: CrSliderProps) {
  return (
    <input
      {...ptAttrs(props.pt, "root")}
      data-part="root"
      type="range"
      class={ptClass(props.pt, props.unstyled, "cr-slider", "root")}
      style={ptStyle(props.pt, props.dt, "root")}
      min={props.min || 0}
      max={props.max || 100}
      step={props.step || 1}
      value={props.value}
      disabled={props.disabled}
      aria-label={props.label || "slider"}
      onInput={(event) => props.onChange && props.onChange(Number((event.target as HTMLInputElement).value))}
    />
  );
}
