import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

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
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}

/* A keycap badge for a keyboard shortcut. Decorative (aria-hidden) — announce the
 * real binding with aria-keyshortcuts on the action itself. Styling via .cr-kbd. */
export default function CrKbd(props: CrKbdProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrKbd"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrKbd"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrKbd"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  return (
    <kbd
      {...ptAttrs(ptResolve(cr, props.pt, "CrKbd"), "root")}
      class={ptClass(ptResolve(cr, props.pt, "CrKbd"), props.unstyled, "cr-kbd" + (props.hint ? " cr-kbd--hint" : "") + (props.on ? " cr-kbd--on" : ""), "root")}
      data-part="root"
      aria-hidden="true"
      style={ptStyle(ptResolve(cr, props.pt, "CrKbd"), props.dt, "root")}
    >
      {props.keys}
    </kbd>
  );
}
