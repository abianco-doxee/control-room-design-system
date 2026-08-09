import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrKbdProps {
  /** The key label, e.g. "I", "⌘K", "esc". */
  keys: string;
  /** Secondary hint — hidden until the host is hovered/focused or the root is peeking. */
  hint?: boolean;
  /** Rendered on a signal-filled surface (inside a filled button) — keys off currentColor. */
  on?: boolean;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* A keycap badge for a keyboard shortcut. Decorative (aria-hidden) — announce the
 * real binding with aria-keyshortcuts on the action itself. Styling via .cr-kbd. */
export default function CrKbd(props: CrKbdProps) {
  return (
    <kbd
      {...ptAttrs(props.pt, "root")}
      class={ptClass(props.pt, props.unstyled, "cr-kbd" + (props.hint ? " cr-kbd--hint" : "") + (props.on ? " cr-kbd--on" : ""), "root")}
      data-part="root"
      aria-hidden="true"
      style={ptStyle(props.pt, props.dt, "root")}
    >
      {props.keys}
    </kbd>
  );
}
