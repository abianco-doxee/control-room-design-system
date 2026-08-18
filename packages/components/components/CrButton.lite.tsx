import { useStore, Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

/** Control Room Button. Two independent axes:
 *  - `emphasis` = visual GRAVITY (form): solid (primary) · outline (secondary) ·
 *    ghost (inline/tertiary) · link (text). This is the hierarchy, not the colour.
 *  - `signal`   = COLOUR key: work · wait · done · err · accent · accent2.
 *  A destructive secondary is `emphasis="outline" signal="err"`.
 *  When `href` is set the control renders as a real `<a>` (so middle-click,
 *  copy-link, and status-bar preview work) and an off-site href automatically
 *  gets `target="_blank" rel="noopener noreferrer"`. See @alebianco/cr-utils/href for the same
 *  detection outside a component.
 *  Styling: @alebianco/cr-styles (components.css) (.cr-btn); `unstyled` drops the classes,
 *  `pt`/`dt` retarget it, the root exposes data-part. */
export interface CrButtonProps {
  emphasis?: "solid" | "outline" | "ghost" | "link";
  signal?: "work" | "wait" | "done" | "err" | "accent" | "accent2";
  size?: "md" | "sm";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  /** Render as a link: the control becomes `<a href>`; off-site hrefs open in a
   *  new tab with a safe `rel`. Mutually exclusive with `type`/`disabled` semantics. */
  href?: string;
  /** Announce a keyboard shortcut (maps to aria-keyshortcuts), e.g. "i" or "Alt+N". */
  keyshortcuts?: string;
  onClick?: () => void;
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Single part: "root". */
  unstyled?: boolean;
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}

export default function CrButton(props: CrButtonProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrButton"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrButton"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrButton"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  const state = useStore({
    get cls(): string {
      let c = "cr-btn";
      if (props.emphasis && props.emphasis !== "solid") c += " cr-btn--" + props.emphasis;
      if (props.signal) c += " cr-btn--sig-" + props.signal;
      if (props.size === "sm") c += " cr-btn--sm";
      return c;
    },
    /* off-site link → new tab. Same logic as @alebianco/cr-utils/href.isExternalHref, inlined
       because a .lite component can't import a package util through the compile. */
    get external(): boolean {
      const h = props.href;
      if (!h) return false;
      if (h.charAt(0) === "#" || h.charAt(0) === "?" || h.charAt(0) === ".") return false;
      if (h.charAt(0) === "/" && h.charAt(1) !== "/") return false;
      if (/^(mailto:|tel:|sms:)/i.test(h)) return false;
      return /^[a-z][\w+.-]*:\/\//i.test(h) || h.indexOf("//") === 0;
    },
  });

  return (
    <Show
      when={props.href}
      else={
        <button
          {...ptAttrs(ptResolve(cr, props.pt, "CrButton"), "root")}
          type={props.type || "button"}
          disabled={props.disabled}
          aria-keyshortcuts={props.keyshortcuts}
          data-part="root"
          onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrButton'), 'root', 'onClick', event); props.onClick && props.onClick(); }}
          class={ptClass(ptResolve(cr, props.pt, "CrButton"), props.unstyled, state.cls, "root")}
          style={ptStyle(ptResolve(cr, props.pt, "CrButton"), props.dt, "root")}
        >
          {props.children}
        </button>
      }
    >
      <a
        {...ptAttrs(ptResolve(cr, props.pt, "CrButton"), "root")}
        href={props.href}
        target={state.external ? "_blank" : undefined}
        rel={state.external ? "noopener noreferrer" : undefined}
        aria-keyshortcuts={props.keyshortcuts}
        aria-disabled={props.disabled ? "true" : undefined}
        data-part="root"
        onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrButton'), 'root', 'onClick', event); props.onClick && props.onClick(); }}
        class={ptClass(ptResolve(cr, props.pt, "CrButton"), props.unstyled, state.cls, "root")}
        style={ptStyle(ptResolve(cr, props.pt, "CrButton"), props.dt, "root")}
      >
        {props.children}
      </a>
    </Show>
  );
}
