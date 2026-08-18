import { onMount, onUpdate, useRef, useStore } from "@builder.io/mitosis";

export interface CrAsciiProps {
  seed: string;
  variant?: "braille" | "block" | "ramp";
  width?: number;
  height?: number;
}

/* Seeded ASCII/Unicode DENSITY FIELD — a low-contrast grid of glyphs whose
 * density follows seeded value-noise, for empty/background space (hero, masthead,
 * behind panels). Purely decorative: aria-hidden, non-interactive, whisper
 * contrast, meant to be mask-faded away from text by the host (.cr-ascii).
 * Imperative canvas repainted on mount and whenever seed/variant/width/height
 * change. See references/decoration.md. */
export default function CrAscii(props: CrAsciiProps) {
  const canvasRef = useRef(null);

  const state = useStore({
    paint() {
      const W = props.width || 320;
      const H = props.height || 140;
      const variantName = props.variant || "braille";
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
      const rng = mulberry32(hashSeed(props.seed));

      const RAMPS: any = {
        block: [" ", "░", "▒", "▓", "█"],
        ramp: [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"],
        braille: [" ", "⠁", "⠃", "⠇", "⡇", "⣇", "⣧", "⣿"],
      };
      const ramp: any = RAMPS[variantName] || RAMPS.braille;

      const lobes = Array.from({ length: 3 }, () => ({
        fx: 0.4 + rng() * 1.6, fy: 0.4 + rng() * 1.6, px: rng() * 6.283, py: rng() * 6.283,
      }));
      const density = (u: number, v: number) => {
        let s = 0;
        for (const l of lobes) s += Math.sin(u * l.fx * 6.283 + l.px) * Math.cos(v * l.fy * 6.283 + l.py);
        return (s / lobes.length + 1) / 2;
      };

      const node: any = canvasRef;
      if (!node || !node.getContext) return;
      const dpr = Math.max(1, Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1));
      node.width = W * dpr; node.height = H * dpr;
      node.style.width = "100%"; node.style.height = "100%";
      const ctx = node.getContext("2d"); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, W, H);

      const cw = variantName === "braille" ? 7 : 9;
      const ch = 12;
      ctx.font = "12px 'JetBrains Mono', ui-monospace, monospace";
      ctx.textBaseline = "top";
      let ink = "#8a86ad";
      try { const v = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim(); if (v) ink = v; } catch (e) {}
      ctx.fillStyle = ink;
      const cols = Math.ceil(W / cw), rows = Math.ceil(H / ch);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const d = density(c / cols, r / rows) * (0.6 + rng() * 0.4);
          const gi = Math.min(ramp.length - 1, Math.floor(d * ramp.length));
          const g = ramp[gi];
          if (g === " ") continue;
          ctx.globalAlpha = 0.12 + d * 0.16;
          ctx.fillText(g, c * cw, r * ch);
        }
      }
      ctx.globalAlpha = 1;
    },
  });

  onMount(() => {
    state.paint();
  });
  onUpdate(() => {
    state.paint();
  }, [props.seed, props.variant, props.width, props.height]);

  return <canvas ref={canvasRef} role="presentation" aria-hidden="true" />;
}
