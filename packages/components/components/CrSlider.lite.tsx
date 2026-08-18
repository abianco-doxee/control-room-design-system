import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler, ptHooks } from "../lib/pt.ts";
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
    const h = ptHooks(ptResolve(cr, props.pt, "CrSlider"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrSlider"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrSlider"));
    if (h && h.onUnmounted) h.onUnmounted();
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
      /* `+value`, not `Number(value)`: Mitosis inlines this handler into the
       * Angular template, which cannot reach globals — `Number` there is
       * "Property 'Number' does not exist" under AOT. The unary plus is an
       * operator, so it compiles everywhere. */
      onInput={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrSlider'), 'root', 'onInput', event); props.onChange && props.onChange(+(event.target as HTMLInputElement).value); }}
    />
  );
}
