import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

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
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}

/* A styled native range input — square track + thumb, keyboard for free (arrows,
 * Home/End, PageUp/Down). Styling via .cr-slider. */
export default function CrSlider(props: CrSliderProps) {
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
      {...ptAttrs(ptResolve(cr, props.pt, "CrSlider"), "root")}
      data-part="root"
      type="range"
      class={ptClass(ptResolve(cr, props.pt, "CrSlider"), props.unstyled, "cr-slider", "root")}
      style={ptStyle(ptResolve(cr, props.pt, "CrSlider"), props.dt, "root")}
      min={props.min || 0}
      max={props.max || 100}
      step={props.step || 1}
      value={props.value}
      disabled={props.disabled}
      aria-label={props.label || "slider"}
      onInput={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrSlider'), 'root', 'onInput', event); props.onChange && props.onChange(Number((event.target as HTMLInputElement).value)); }}
    />
  );
}
