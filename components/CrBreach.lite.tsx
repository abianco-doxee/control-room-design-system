export interface CrBreachProps {
  /** Signal that keys the glow. Defaults to accent (omit for accent). */
  signal?: "work" | "wait" | "done" | "err" | "accent2";
  /** Add the gradient wash over the surface. */
  wash?: boolean;
  /** Slow living glow (off under prefers-reduced-motion). */
  alive?: boolean;
  children?: any;
}

/** The Breach (Law 9) — the ONE sanctioned rule-break per screen. Licenses the
 * forbidden vocabulary (soft corner, blurred blob, colour glow, gradient) on a
 * single element to spotlight the most exceptional thing. Use at most once per
 * screen; everything around it must stay hard-edged or the breach stops reading.
 * Styling stays in the cr- classes (no inline style). See
 * references/design-language.md (Law 9) + references/components.md#breach. */
export default function CrBreach(props: CrBreachProps) {
  return (
    <div
      class={
        "cr-breach" +
        (props.signal ? " cr-breach--" + props.signal : "") +
        (props.wash ? " cr-breach--wash" : "") +
        (props.alive ? " cr-breach--alive" : "")
      }
    >
      {props.children}
    </div>
  );
}
