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

/* Spinner — an indeterminate loading indicator. The wrapper is role=status with
 * an accessible label so assistive tech announces the wait; the spinning ring is
 * aria-hidden. Motion is CSS and honours prefers-reduced-motion. For a known
 * fraction use Progress or Meter instead. Styling via .cr-spinner. */
export default function CrSpinner(props: CrSpinnerProps) {
  return (
    <span {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-spinner" + (props.size ? " cr-spinner--" + props.size : ""), "root")} data-part="root" style={ptStyle(props.pt, props.dt, "root")} role="status" aria-label={props.label || "Loading"}>
      <span {...ptAttrs(props.pt, "ring")} class={ptClass(props.pt, props.unstyled, "cr-spinner__ring", "ring")} data-part="ring" aria-hidden="true"></span>
    </span>
  );
}
