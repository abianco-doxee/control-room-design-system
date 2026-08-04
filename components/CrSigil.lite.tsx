import { onMount, useRef } from "@builder.io/mitosis";

export interface CrSigilProps {
  /** Any string — same seed always yields the same sigil (identity from seed). */
  seed: string;
  /** Optional machine state; keys the glow hue like the seeded cat. */
  state?: "working" | "waiting" | "idle" | "error" | "done";
  size?: number;
}

/** Seeded cyber-sigil — a retro-futuristic pixel glyph generated from a seed.
 * A vertically-mirrored spine with radiating arms, node clusters and downward
 * drips (cyber-sigilism). Imperative canvas painted in onMount; Mitosis resolves
 * the ref per target. See references/seeded-sigil.md. */
export default function CrSigil(props: CrSigilProps) {
  const canvasRef = useRef(null);

  onMount(() => {
    const px = props.size || 48;
    const G = 16;
    const hashSeed = (s: string) => {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
      return h >>> 0;
    };
    const mulberry32 = (a: number) => () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const INK = ["#00d3fb", "#ff1a9d", "#9ad335", "#00deaa", "#b061ff", "#f9ad00"];
    const stateHue: any = { working: "#00d3fb", waiting: "#f9ad00", idle: "#848496", error: "#f45058", done: "#9ad335" };
    const rng = mulberry32(hashSeed(props.seed));
    const ink = props.state ? stateHue[props.state] : INK[Math.floor(rng() * INK.length)];

    const m: number[][] = Array.from({ length: G }, () => new Array(G).fill(0));
    const cx = G >> 1;
    const set = (x: number, y: number) => {
      if (x >= 0 && x < G && y >= 0 && y < G) { m[y][x] = 1; m[y][G - 1 - x] = 1; } // mirror on vertical axis
    };
    // spine
    for (let y = 2; y < G - 2; y++) if (rng() > 0.22) set(cx, y);
    // radiating arms + node clusters
    const arms = 3 + Math.floor(rng() * 3);
    for (let a = 0; a < arms; a++) {
      let x = cx; let y = 2 + Math.floor(rng() * (G - 6));
      const len = 2 + Math.floor(rng() * 4);
      for (let i = 0; i < len; i++) { x += rng() > 0.5 ? 1 : 0; y += rng() > 0.4 ? 1 : 0; set(x, y); }
      set(x, y); if (rng() > 0.5) { set(x + 1, y); set(x, y + 1); }
    }
    // drips (cyber-sigil signature) — trail down from the lowest lit cell in each column
    for (let x = 0; x <= cx; x++) {
      let low = -1; for (let y = 0; y < G; y++) if (m[y][x]) low = y;
      if (low >= 0 && rng() > 0.45) { const d = 1 + Math.floor(rng() * 3); for (let i = 1; i <= d; i++) set(x, low + i); }
    }
    // crown node (occult tell)
    set(cx, 2); if (rng() > 0.4) set(cx - 1, 3);

    const node: any = canvasRef;
    if (!node || !node.getContext) return;
    const dpr = Math.max(1, Math.min(3, (typeof window !== "undefined" && window.devicePixelRatio) || 1));
    const cell = Math.max(1, Math.round((px * dpr) / G)); const back = cell * G;
    node.width = back; node.height = back; node.style.width = px + "px"; node.style.height = px + "px";
    const ctx = node.getContext("2d"); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, back, back);
    // faint halftone bleed behind the glyph
    ctx.globalAlpha = 0.12; ctx.fillStyle = ink;
    for (let y = cell; y < back; y += cell * 2) for (let x = cell; x < back; x += cell * 2) ctx.fillRect(x, y, 1, 1);
    ctx.globalAlpha = 1;
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) if (m[y][x]) { ctx.fillStyle = ink; ctx.fillRect(x * cell, y * cell, cell, cell); }
  });

  return <canvas ref={canvasRef} role="img" aria-label={props.seed + " sigil"} />;
}
