import { useStore } from "@builder.io/mitosis";

export interface CrTooltipProps {
  /** Unique id wiring the trigger's aria-describedby to the bubble. */
  id: string;
  label?: string;
  children?: any;
}

/** A hint bubble revealed on hover/focus. The bubble carries role=tooltip and
 * the trigger points at it via aria-describedby, so it is announced without
 * stealing focus. Reveal is CSS (:hover/:focus-within); the only JS is a dismiss
 * latch so Escape hides the bubble without moving focus — WCAG 1.4.13 (Content on
 * Hover or Focus: dismissable). Leaving the trigger (blur) or moving the pointer
 * away clears the latch, so the next hover/focus shows it again.
 * See references/components.md#tooltip. */
export default function CrTooltip(props: CrTooltipProps) {
  const state = useStore({
    dismissed: false,
    onKey(event: any) {
      if (event.key === "Escape") state.dismissed = true;
    },
    reset() {
      state.dismissed = false;
    },
  });

  return (
    <span class="cr-tooltip" data-dismissed={state.dismissed ? "true" : undefined} onMouseLeave={() => state.reset()}>
      <span
        class="cr-tooltip__trigger"
        tabIndex={0}
        aria-describedby={props.id}
        onKeyDown={(event) => state.onKey(event)}
        onBlur={() => state.reset()}
      >
        {props.children}
      </span>
      <span class="cr-tooltip__bubble" role="tooltip" id={props.id}>
        {props.label}
      </span>
    </span>
  );
}
