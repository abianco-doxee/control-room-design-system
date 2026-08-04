export interface CrSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  onChange?: (value: number) => void;
}

/* A styled native range input — square track + thumb, keyboard for free (arrows,
 * Home/End, PageUp/Down). Styling via .cr-slider. */
export default function CrSlider(props: CrSliderProps) {
  return (
    <input
      type="range"
      class="cr-slider"
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
