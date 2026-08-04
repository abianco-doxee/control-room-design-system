export interface CrHoverCardProps {
  /** Trigger text (focusable so keyboard users get the card too). */
  label: string;
  /** Accessible name for the card panel. */
  title?: string;
  align?: "left" | "right";
  children?: any;
}

/* A rich hover/focus card — like Tooltip but for structured content. Reveal is
 * CSS-driven (hover + focus-within, with an open delay); the trigger is focusable
 * so keyboard users get it too. For a plain text hint use Tooltip; for a list of
 * actions use Menu. Styling via .cr-hovercard. */
export default function CrHoverCard(props: CrHoverCardProps) {
  return (
    <span class="cr-hovercard">
      <span class="cr-hovercard__trigger" tabIndex={0}>
        {props.label}
      </span>
      <span
        class={"cr-hovercard__panel" + (props.align === "right" ? " cr-hovercard__panel--right" : "")}
        role="group"
        aria-label={props.title || props.label}
      >
        {props.children}
      </span>
    </span>
  );
}
