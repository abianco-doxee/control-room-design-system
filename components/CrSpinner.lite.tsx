export interface CrSpinnerProps {
  /** Accessible label announced by screen readers. Defaults to "Loading". */
  label?: string;
  /** Size token: "sm" · "lg" (default medium). */
  size?: string;
}

/* Spinner — an indeterminate loading indicator. The wrapper is role=status with
 * an accessible label so assistive tech announces the wait; the spinning ring is
 * aria-hidden. Motion is CSS and honours prefers-reduced-motion. For a known
 * fraction use Progress or Meter instead. Styling via .cr-spinner. */
export default function CrSpinner(props: CrSpinnerProps) {
  return (
    <span class={"cr-spinner" + (props.size ? " cr-spinner--" + props.size : "")} role="status" aria-label={props.label || "Loading"}>
      <span class="cr-spinner__ring" aria-hidden="true"></span>
    </span>
  );
}
