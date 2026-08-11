import { Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

/** Control Room error surface — the one place besides the masthead where Law 3's
 *  house glitch is allowed. The surface floods with `--sig-err` (Law 2 makes hue
 *  the state channel, so an error region reads as error because the region *is*
 *  the colour) and carries the vertical `--drip` glitch, which is what marks the
 *  state as *degraded* rather than merely coloured.
 *
 *  The drip is a `::before` overlay, so the title and sub sit in their own
 *  stacking context to stay above it.
 *
 *  Styling: @alebianco/cr-styles (components.css) (.cr-drip); `unstyled` drops the
 *  classes, `pt`/`dt` retarget it, every part exposes data-part. */
export interface CrDripProps {
  title: string;
  /** The operational line — endpoint, retry count — that makes an error
   *  actionable. Stays in the mono data register per Law 5. */
  sub?: string;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "title" · "sub". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
export default function CrDrip(props: CrDripProps) {
  return (
    <div {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-drip", "root")} data-part="root" style={ptStyle(props.pt, props.dt, "root")}>
      <div {...ptAttrs(props.pt, "title")} class={ptClass(props.pt, props.unstyled, "cr-drip__title", "title")} data-part="title">{props.title}</div>
      <Show when={props.sub}><div {...ptAttrs(props.pt, "sub")} class={ptClass(props.pt, props.unstyled, "cr-drip__sub", "sub")} data-part="sub">{props.sub}</div></Show>
    </div>
  );
}
