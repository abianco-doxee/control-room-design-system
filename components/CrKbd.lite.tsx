export interface CrKbdProps {
  /** The key label, e.g. "I", "⌘K", "esc". */
  keys: string;
  /** Secondary hint — hidden until the host is hovered/focused or the root is peeking. */
  hint?: boolean;
  /** Rendered on a signal-filled surface (inside a filled button) — keys off currentColor. */
  on?: boolean;
}

/* A keycap badge for a keyboard shortcut. Decorative (aria-hidden) — announce the
 * real binding with aria-keyshortcuts on the action itself. Styling via .cr-kbd. */
export default function CrKbd(props: CrKbdProps) {
  return (
    <kbd
      class={"cr-kbd" + (props.hint ? " cr-kbd--hint" : "") + (props.on ? " cr-kbd--on" : "")}
      aria-hidden="true"
    >
      {props.keys}
    </kbd>
  );
}
