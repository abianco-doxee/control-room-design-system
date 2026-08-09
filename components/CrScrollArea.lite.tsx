export interface CrScrollAreaProps {
  /** Max size along the scroll axis (e.g. "16rem", "40vh"). */
  maxHeight?: string;
  /** Scroll axis: "y" (default) · "x" · "both". */
  axis?: string;
  /** Accessible name — set it when the region should be keyboard-scrollable and
   *  announced (a focusable scroll container needs a name). */
  label?: string;
  children?: any;
}

/* ScrollArea — a container with cross-browser styled scrollbars (thin, inked,
 * neon thumb) that keep the Control Room look instead of the OS default. It's
 * keyboard-scrollable: `tabindex=0` so arrow/Page keys work, and when given a
 * `label` it becomes a named `role="group"` so assistive tech announces it. The
 * scrollbar styling is pure CSS (scrollbar-width + ::-webkit-scrollbar); the
 * content scrolls natively. Styling via .cr-scroll. */
export default function CrScrollArea(props: CrScrollAreaProps) {
  return (
    <div
      class={"cr-scroll" + (props.axis === "x" ? " cr-scroll--x" : props.axis === "both" ? " cr-scroll--both" : "")}
      tabIndex={0}
      role={props.label ? "group" : undefined}
      aria-label={props.label}
      style={{ maxHeight: props.maxHeight }}
    >
      {props.children}
    </div>
  );
}
