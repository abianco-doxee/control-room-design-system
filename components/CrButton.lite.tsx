import { useStore } from "@builder.io/mitosis";

/** Control Room Button. Two independent axes:
 *  - `emphasis` = visual GRAVITY (form): solid (primary) · outline (secondary) ·
 *    ghost (inline/tertiary) · link (text). This is the hierarchy, not the colour.
 *  - `signal`   = COLOUR key: work · wait · done · err · accent · accent2.
 *  A destructive secondary is `emphasis="outline" signal="err"`.
 *  Styling: styles/components.css (.cr-btn). */
export interface CrButtonProps {
  emphasis?: "solid" | "outline" | "ghost" | "link";
  signal?: "work" | "wait" | "done" | "err" | "accent" | "accent2";
  size?: "md" | "sm";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  /** Announce a keyboard shortcut (maps to aria-keyshortcuts), e.g. "i" or "Alt+N". */
  keyshortcuts?: string;
  onClick?: () => void;
  children?: any;
  /** @deprecated use `emphasis` (gravity) + `signal` (colour) */
  kind?: "primary" | "controls" | "work" | "accent" | "err";
}

export default function CrButton(props: CrButtonProps) {
  const state = useStore({
    get cls(): string {
      let emph = props.emphasis;
      let sig = props.signal;
      // legacy `kind` → (emphasis, signal)
      if (!emph && !sig && props.kind) {
        if (props.kind === "controls") emph = "outline";
        else if (props.kind === "primary") emph = "solid";
        else { emph = "solid"; sig = props.kind as any; }
      }
      let c = "cr-btn";
      if (emph && emph !== "solid") c += " cr-btn--" + emph;
      if (sig) c += " cr-btn--sig-" + sig;
      if (props.size === "sm") c += " cr-btn--sm";
      return c;
    },
  });

  return (
    <button
      type={props.type || "button"}
      disabled={props.disabled}
      aria-keyshortcuts={props.keyshortcuts}
      onClick={() => props.onClick && props.onClick()}
      class={state.cls}
    >
      {props.children}
    </button>
  );
}
