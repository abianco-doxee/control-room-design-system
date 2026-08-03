export interface CrTooltipProps {
  /** Unique id wiring the trigger's aria-describedby to the bubble. */
  id: string;
  label?: string;
  children?: any;
}

/** A hint bubble revealed on hover/focus. The bubble carries role=tooltip and
 * the trigger points at it via aria-describedby, so it is announced without
 * stealing focus. Reveal is pure CSS (:hover/:focus-within) — no JS state.
 * See references/components.md#tooltip. */
export default function CrTooltip(props: CrTooltipProps) {
  return (
    <span class="cr-tooltip">
      <span class="cr-tooltip__trigger" tabindex={0} aria-describedby={props.id}>
        {props.children}
      </span>
      <span class="cr-tooltip__bubble" role="tooltip" id={props.id}>
        {props.label}
      </span>
    </span>
  );
}
