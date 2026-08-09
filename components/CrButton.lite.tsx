import { useStore } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

/** Control Room Button. Two independent axes:
 *  - `emphasis` = visual GRAVITY (form): solid (primary) · outline (secondary) ·
 *    ghost (inline/tertiary) · link (text). This is the hierarchy, not the colour.
 *  - `signal`   = COLOUR key: work · wait · done · err · accent · accent2.
 *  A destructive secondary is `emphasis="outline" signal="err"`.
 *  Styling: styles/components.css (.cr-btn); `unstyled` drops the classes,
 *  `pt`/`dt` retarget it, the root exposes data-part. */
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
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Single part: "root". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

export default function CrButton(props: CrButtonProps) {
  const state = useStore({
    get cls(): string {
      let c = "cr-btn";
      if (props.emphasis && props.emphasis !== "solid") c += " cr-btn--" + props.emphasis;
      if (props.signal) c += " cr-btn--sig-" + props.signal;
      if (props.size === "sm") c += " cr-btn--sm";
      return c;
    },
  });

  return (
    <button
      {...ptAttrs(props.pt, "root")}
      type={props.type || "button"}
      disabled={props.disabled}
      aria-keyshortcuts={props.keyshortcuts}
      data-part="root"
      onClick={() => props.onClick && props.onClick()}
      class={ptClass(props.pt, props.unstyled, state.cls, "root")}
      style={ptStyle(props.pt, props.dt, "root")}
    >
      {props.children}
    </button>
  );
}
