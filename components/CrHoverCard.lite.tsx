import { useStore } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrHoverCardProps {
  /** Trigger text (focusable so keyboard users get the card too). */
  label: string;
  /** Accessible name for the card panel. */
  title?: string;
  align?: "left" | "right";
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "trigger" · "panel". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* A rich hover/focus card — like Tooltip but for structured content. Reveal is
 * CSS-driven (hover + focus-within, with an open delay); the trigger is focusable
 * so keyboard users get it too. Escape latches the card hidden without moving
 * focus (WCAG 1.4.13, dismissable); blur or pointer-leave clears the latch so the
 * next hover/focus shows it again. For a plain text hint use Tooltip; for a list
 * of actions use Menu. Styling via .cr-hovercard. */
export default function CrHoverCard(props: CrHoverCardProps) {
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
    <span {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-hovercard", "root")} data-part="root" data-state={state.dismissed ? "dismissed" : undefined} style={ptStyle(props.pt, props.dt, "root")} data-dismissed={state.dismissed ? "true" : undefined} onMouseLeave={() => state.reset()}>
      <span {...ptAttrs(props.pt, "trigger")} class={ptClass(props.pt, props.unstyled, "cr-hovercard__trigger", "trigger")} data-part="trigger" tabIndex={0} onKeyDown={(event) => state.onKey(event)} onBlur={() => state.reset()}>
        {props.label}
      </span>
      <span
        {...ptAttrs(props.pt, "panel")}
        class={ptClass(props.pt, props.unstyled, "cr-hovercard__panel" + (props.align === "right" ? " cr-hovercard__panel--right" : ""), "panel")}
        data-part="panel"
        role="group"
        aria-label={props.title || props.label}
      >
        {props.children}
      </span>
    </span>
  );
}
