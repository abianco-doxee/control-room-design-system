import { useStore } from "@builder.io/mitosis";

export interface CrTelemetryProps {
  seed: string;
}

/* A seeded FUI telemetry string — a NERV-style decorative readout (hex id, a
 * pseudo-byte, a pseudo-latency, a mini bar) for riding a frame edge / masthead
 * corner. DECORATION, not data: aria-hidden, non-selectable. Real numbers use
 * real components. See references/decoration.md.
 *
 * The derivation lives in a useStore getter (not free consts in the body) so the
 * Mitosis codegen keeps it — free consts get stripped from the compiled output. */
export default function CrTelemetry(props: CrTelemetryProps) {
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
      const lat = 4 + (h % 36);
      const level = h % 5;
      const bar = "▮▮▮▮▮".slice(0, level) + "▯▯▯▯▯".slice(0, 5 - level);
      return "SEED " + id + " · 0x" + byte + " · " + lat + "ms " + bar;
    },
  });

  return (
    <span class="cr-telemetry" role="presentation" aria-hidden="true">
      {state.line}
    </span>
  );
}
