export interface CrButtonProps {
  kind?: "primary" | "controls" | "work" | "accent" | "err";
  size?: "md" | "sm";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  /** Announce a keyboard shortcut (maps to aria-keyshortcuts), e.g. "i" or "Alt+N". */
  keyshortcuts?: string;
  onClick?: () => void;
  children?: any;
}

/** Control Room Button. Styling comes from styles/components.css (.cr-btn). */
export default function CrButton(props: CrButtonProps) {
  return (
    <button
      type={props.type || "button"}
      disabled={props.disabled}
      aria-keyshortcuts={props.keyshortcuts}
      onClick={() => props.onClick && props.onClick()}
      class={
        "cr-btn" +
        (props.kind && props.kind !== "primary" ? " cr-btn--" + props.kind : "") +
        (props.size === "sm" ? " cr-btn--sm" : "")
      }
    >
      {props.children}
    </button>
  );
}
