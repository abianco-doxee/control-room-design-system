import { Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrOverflowProps {
  /** How many items are hidden. */
  count: number;
  /** Whether the hidden items are currently revealed. */
  expanded?: boolean;
  /** Noun for the accessible name, e.g. "sessions" → "show 3 more sessions". */
  noun: string;
  /** When omitted, the control is inert (a plain "+N" count, not a button). */
  onToggle?: () => void;
  /* ── styling contract (portable pt/dt subset). Single part: "root". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* An a11y-correct "+N more" disclosure for truncated lists. With onToggle it's a
 * <button aria-expanded> that reveals/hides the overflow; without it, an inert
 * count. The accessible name always includes the noun (screen readers never hear
 * a bare "+3"). Styling: .cr-overflow; data-part="root". */
export default function CrOverflow(props: CrOverflowProps) {
  return (
    <Show
      when={props.onToggle}
      else={
        <span
          {...ptAttrs(props.pt, "root")}
          data-part="root"
          class={ptClass(props.pt, props.unstyled, "cr-overflow cr-overflow--static", "root")}
          style={ptStyle(props.pt, props.dt, "root")}
        >
          {"+" + props.count + " " + props.noun}
        </span>
      }
    >
      <button
        {...ptAttrs(props.pt, "root")}
        type="button"
        data-part="root"
        aria-expanded={props.expanded ? "true" : "false"}
        aria-label={props.expanded ? "show fewer " + props.noun : "show " + props.count + " more " + props.noun}
        class={ptClass(props.pt, props.unstyled, "cr-overflow", "root")}
        style={ptStyle(props.pt, props.dt, "root")}
        onClick={() => props.onToggle && props.onToggle()}
      >
        {props.expanded ? "show less" : "+" + props.count + " more"}
      </button>
    </Show>
  );
}
