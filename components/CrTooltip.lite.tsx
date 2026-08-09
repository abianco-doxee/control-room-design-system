import { useStore } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrTooltipProps {
  /** Unique id wiring the trigger's aria-describedby to the bubble. */
  id: string;
  label?: string;
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "trigger" · "bubble". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
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
    <span {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-tooltip", "root")} data-part="root" data-state={state.dismissed ? "dismissed" : undefined} style={ptStyle(props.pt, props.dt, "root")} data-dismissed={state.dismissed ? "true" : undefined} onMouseLeave={() => state.reset()}>
      <span
        {...ptAttrs(props.pt, "trigger")}
        class={ptClass(props.pt, props.unstyled, "cr-tooltip__trigger", "trigger")}
        data-part="trigger"
        tabIndex={0}
        aria-describedby={props.id}
        onKeyDown={(event) => state.onKey(event)}
        onBlur={() => state.reset()}
      >
        {props.children}
      </span>
      <span {...ptAttrs(props.pt, "bubble")} class={ptClass(props.pt, props.unstyled, "cr-tooltip__bubble", "bubble")} data-part="bubble" role="tooltip" id={props.id}>
        {props.label}
      </span>
    </span>
  );
}
