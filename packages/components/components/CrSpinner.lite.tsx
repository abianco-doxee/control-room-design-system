import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrSpinnerProps {
  /** Accessible label announced by screen readers. Defaults to "Loading". */
  label?: string;
  /** Size token: "sm" · "lg" (default medium). */
  size?: string;
  /** Signal for the cells (canonical vocabulary): work · wait · done · err · idle. Defaults to work. */
  signal?: "work" | "wait" | "done" | "err" | "idle";
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
 *
 * `signal` keys the cells to the canonical vocabulary (work · wait · done · err ·
 * idle), the same tone set Progress uses, so a spinner in a failing region reads
 * as failing instead of always-work blue. It is a redundant cue: the accessible
 * name on role=status carries the meaning for assistive tech.
 * For a known fraction, or a static capacity reading, use Progress instead.
 * Styling via .cr-spinner. */
export default function CrSpinner(props: CrSpinnerProps) {
  return (
    <span {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-spinner" + (props.size ? " cr-spinner--" + props.size : "") + (props.signal ? " cr-spinner--" + props.signal : ""), "root")} data-part="root" data-state={props.signal} style={ptStyle(props.pt, props.dt, "root")} role="status" aria-label={props.label || "Loading"}>
      <span {...ptAttrs(props.pt, "ring")} class={ptClass(props.pt, props.unstyled, "cr-spinner__ring", "ring")} data-part="ring" aria-hidden="true"></span>
      <span class={ptClass(props.pt, props.unstyled, "cr-spinner__ring", "ring")} data-part="ring" aria-hidden="true"></span>
      <span class={ptClass(props.pt, props.unstyled, "cr-spinner__ring", "ring")} data-part="ring" aria-hidden="true"></span>
      <span class={ptClass(props.pt, props.unstyled, "cr-spinner__ring", "ring")} data-part="ring" aria-hidden="true"></span>
    </span>
  );
}
