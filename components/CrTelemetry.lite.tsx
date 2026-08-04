export interface CrTelemetryProps {
  seed: string;
}

/* A seeded FUI telemetry string — a NERV-style decorative readout (hex id, a
 * pseudo-byte, a pseudo-latency, a mini bar) for riding a frame edge / masthead
 * corner. DECORATION, not data: aria-hidden, non-selectable. Real numbers use
 * real components. See references/decoration.md. */
export default function CrTelemetry(props: CrTelemetryProps) {
  const hashSeed = (s: string) => {
    let x = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; }
    return x >>> 0;
  };
  const h = hashSeed(props.seed);
  const id = ("0000" + h.toString(16).toUpperCase()).slice(-4);
  const byte = ("0" + ((h >> 8) & 0xff).toString(16).toUpperCase()).slice(-2);
  const lat = 4 + (h % 36);
  const level = h % 5;
  const bar = "▮▮▮▮▮".slice(0, level) + "▯▯▯▯▯".slice(0, 5 - level);

  return (
    <span class="cr-telemetry" role="presentation" aria-hidden="true">
      {"SEED " + id + " · 0x" + byte + " · " + lat + "ms " + bar}
    </span>
  );
}
