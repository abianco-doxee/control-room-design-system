import { Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";
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
  pt?: any;
  dt?: any;
}
export default function CrPanel(props: CrPanelProps) {
  return (
    <section
      {...ptAttrs(props.pt, "root")}
      class={ptClass(
        props.pt,
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
      style={ptStyle(props.pt, props.dt, "root")}
    >
      <Show when={props.bleed}>
        <i
          {...ptAttrs(props.pt, "bleed")}
          class={ptClass(props.pt, props.unstyled, "cr-panel__bleed", "bleed")}
          data-part="bleed"
          data-bleed={props.bleed}
          aria-hidden="true"
        />
      </Show>
      <Show when={props.index}>
        <span
          {...ptAttrs(props.pt, "index")}
          class={ptClass(props.pt, props.unstyled, "cr-panel__index", "index")}
          data-part="index"
          aria-hidden="true"
        >
          {props.index}
        </span>
      </Show>
      <Show when={props.eyebrow}>
        <p {...ptAttrs(props.pt, "eyebrow")} class={ptClass(props.pt, props.unstyled, "cr-panel__eyebrow", "eyebrow")} data-part="eyebrow">{props.eyebrow}</p>
      </Show>
      <Show when={props.title}><h4 {...ptAttrs(props.pt, "title")} class={ptClass(props.pt, props.unstyled, "cr-panel__title", "title")} data-part="title">{props.title}</h4></Show>
      <Show when={props.lede}>
        <p {...ptAttrs(props.pt, "lede")} class={ptClass(props.pt, props.unstyled, "cr-panel__lede", "lede")} data-part="lede">{props.lede}</p>
      </Show>
      {props.children}
      <Show when={props.footer}>
        <p {...ptAttrs(props.pt, "footer")} class={ptClass(props.pt, props.unstyled, "cr-panel__footer", "footer")} data-part="footer">{props.footer}</p>
      </Show>
    </section>
  );
}
