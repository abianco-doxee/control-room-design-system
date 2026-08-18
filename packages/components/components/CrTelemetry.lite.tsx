import { useStore, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrTelemetryProps {
  seed: string;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}

/* A seeded FUI telemetry string — a NERV-style decorative readout (hex id, a
 * pseudo-byte, a channel tag, a mini bar) for riding a frame edge / masthead
 * corner. DECORATION, not data: aria-hidden, non-selectable. Real numbers use
 * real components. See references/decoration.md.
 *
 * Every field is deliberately UNITLESS. An earlier version printed "41ms", which
 * reads as a real latency measurement — the one thing this component must never
 * be mistaken for. The channel tag (CH04…CH39) is an identifier, not a quantity,
 * so there is no unit to misread.
 *
 * The derivation lives in a useStore getter (not free consts in the body) so the
 * Mitosis codegen keeps it — free consts get stripped from the compiled output. */
export default function CrTelemetry(props: CrTelemetryProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTelemetry"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTelemetry"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTelemetry"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  const state = useStore({
    get line(): string {
      let x = 2166136261 >>> 0;
      for (let i = 0; i < props.seed.length; i++) {
        x ^= props.seed.charCodeAt(i);
        x = Math.imul(x, 16777619) >>> 0;
      }
      const h = x >>> 0;
      const id = ("0000" + h.toString(16).toUpperCase()).slice(-4);
      const byte = ("0" + ((h >> 8) & 0xff).toString(16).toUpperCase()).slice(-2);
      const idx = ("00" + (4 + (h % 36))).slice(-2);
      const level = h % 5;
      const bar = "▮▮▮▮▮".slice(0, level) + "▯▯▯▯▯".slice(0, 5 - level);
      return "SEED " + id + " · 0x" + byte + " · CH" + idx + " " + bar;
    },
  });

  return (
    <span {...ptAttrs(ptResolve(cr, props.pt, "CrTelemetry"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrTelemetry"), props.unstyled, "cr-telemetry", "root")} data-part="root" role="presentation" aria-hidden="true" style={ptStyle(ptResolve(cr, props.pt, "CrTelemetry"), props.dt, "root")}>
      {state.line}
    </span>
  );
}
