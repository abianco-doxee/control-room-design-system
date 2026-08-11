import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrSpinnerProps {
  /** Accessible label announced by screen readers. Defaults to "Loading". */
  label?: string;
  /** Size token: "sm" · "lg" (default medium). */
  size?: string;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "ring". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* Spinner — an indeterminate loading indicator. Four cells from the block shade
 * ramp (░▒▓█) chase each other around a SQUARE track: a rotating circle would
 * contradict Law 1's rectangular chassis and reads as a framework default.
 *
 * The wrapper is role=status with an accessible label so assistive tech
 * announces the wait; the four cells are aria-hidden decoration. The glyphs
 * come from CSS content, so the ramp order is one thing in one place. Motion is
 * CSS and honours prefers-reduced-motion (cells hold position and pulse).
 * For a known fraction use Progress or Meter instead. Styling via .cr-spinner. */
export default function CrSpinner(props: CrSpinnerProps) {
  return (
    <span {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-spinner" + (props.size ? " cr-spinner--" + props.size : ""), "root")} data-part="root" style={ptStyle(props.pt, props.dt, "root")} role="status" aria-label={props.label || "Loading"}>
      <span {...ptAttrs(props.pt, "ring")} class={ptClass(props.pt, props.unstyled, "cr-spinner__ring", "ring")} data-part="ring" aria-hidden="true"></span>
      <span class={ptClass(props.pt, props.unstyled, "cr-spinner__ring", "ring")} data-part="ring" aria-hidden="true"></span>
      <span class={ptClass(props.pt, props.unstyled, "cr-spinner__ring", "ring")} data-part="ring" aria-hidden="true"></span>
      <span class={ptClass(props.pt, props.unstyled, "cr-spinner__ring", "ring")} data-part="ring" aria-hidden="true"></span>
    </span>
  );
}
