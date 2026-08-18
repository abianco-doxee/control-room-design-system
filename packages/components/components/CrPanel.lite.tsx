import { Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";
export interface CrPanelProps {
  title?: string;
  weight?: "default" | "major";
  inset?: boolean;
  /** Mono label above the title. Real text — put a readable unit id HERE, not in `index`. */
  eyebrow?: string;
  /** Stamped ghost numeral, top-right. Decorative: aria-hidden, never a datum. */
  index?: string;
  /** Standfirst under the title, ruled off with the second key. */
  lede?: string;
  /** Pinned to the bottom edge — the stamped plate line. */
  footer?: string;
  /** Keys the eyebrow to a machine state (Law 2 — a hue asserts a real state). */
  tone?: "work" | "wait" | "done" | "err" | "idle" | "accent";
  /** Registration ticks — reuses the shipped `.cr-mark` preset. */
  marks?: boolean;
  /** Masked edge texture. Law 6 caps this at ONE bled panel per screen. */
  bleed?: "halftone" | "dither" | "scan" | "glass";
  /** Ambient loop — reuses the shipped `.cr-anim-*` classes; off under reduced motion. */
  ambient?: "scan" | "pulse";
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "bleed" · "index" · "eyebrow" · "title" · "lede" · "footer". */
  unstyled?: boolean;
  pt?: CrPassThrough<"bleed" | "eyebrow" | "footer" | "index" | "lede" | "root" | "title">;
  dt?: CrDesignTokens;
}
export default function CrPanel(props: CrPanelProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrPanel"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrPanel"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrPanel"));
    if (h && h.onUnmounted) h.onUnmounted();
  });


  return (
    <section
      {...ptAttrs(ptResolve(cr, props.pt, "CrPanel"), "root")}
      class={ptClass(ptResolve(cr, props.pt, "CrPanel"),
        props.unstyled,
        "cr-panel" +
          (props.weight === "major" ? " cr-panel--major" : "") +
          (props.inset ? " cr-panel--inset" : "") +
          (props.tone ? " cr-panel--tone-" + props.tone : "") +
          (props.marks ? " cr-mark" : "") +
          (props.ambient ? " cr-anim-" + props.ambient : ""),
        "root",
      )}
      data-part="root"
      data-state={props.weight || "default"}
      style={ptStyle(ptResolve(cr, props.pt, "CrPanel"), props.dt, "root")}
    >
      <Show when={props.bleed}>
        <i
          {...ptAttrs(ptResolve(cr, props.pt, "CrPanel"), "bleed")}
          class={ptClass(ptResolve(cr, props.pt, "CrPanel"), props.unstyled, "cr-panel__bleed", "bleed")}
          data-part="bleed"
          data-bleed={props.bleed}
          aria-hidden="true"
        />
      </Show>
      <Show when={props.index}>
        <span
          {...ptAttrs(ptResolve(cr, props.pt, "CrPanel"), "index")}
          class={ptClass(ptResolve(cr, props.pt, "CrPanel"), props.unstyled, "cr-panel__index", "index")}
          data-part="index"
          aria-hidden="true"
        >
          {props.index}
        </span>
      </Show>
      <Show when={props.eyebrow}>
        <p {...ptAttrs(ptResolve(cr, props.pt, "CrPanel"), "eyebrow")} class={ptClass(ptResolve(cr, props.pt, "CrPanel"), props.unstyled, "cr-panel__eyebrow", "eyebrow")} data-part="eyebrow">{props.eyebrow}</p>
      </Show>
      <Show when={props.title}><h4 {...ptAttrs(ptResolve(cr, props.pt, "CrPanel"), "title")} class={ptClass(ptResolve(cr, props.pt, "CrPanel"), props.unstyled, "cr-panel__title", "title")} data-part="title">{props.title}</h4></Show>
      <Show when={props.lede}>
        <p {...ptAttrs(ptResolve(cr, props.pt, "CrPanel"), "lede")} class={ptClass(ptResolve(cr, props.pt, "CrPanel"), props.unstyled, "cr-panel__lede", "lede")} data-part="lede">{props.lede}</p>
      </Show>
      {props.children}
      <Show when={props.footer}>
        <p {...ptAttrs(ptResolve(cr, props.pt, "CrPanel"), "footer")} class={ptClass(ptResolve(cr, props.pt, "CrPanel"), props.unstyled, "cr-panel__footer", "footer")} data-part="footer">{props.footer}</p>
      </Show>
    </section>
  );
}
