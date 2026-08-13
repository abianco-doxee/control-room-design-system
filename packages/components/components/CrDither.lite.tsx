import { onMount, onUpdate, useRef, useStore } from "@builder.io/mitosis";

export interface CrDitherProps {
  /** Any string — same seed always yields the same field (identity from seed). */
  seed: string;
  /** `bayer` = ordered 1-bit dither; `halftone` = variable-density dots. */
  mode?: "bayer" | "halftone";
  /** Machine state; keys the ink hue. Omit for a seed-picked signal. */
  state?: "working" | "waiting" | "idle" | "error" | "done";
  width?: number;
  height?: number;
}

/** Seeded dither / halftone field — hero and masthead hardware only.
 *
 * The genuine article the CSS texture tokens only approximate: a real Bayer 4x4
 * ordered dither, or variable-density halftone dots, painted from a seed.
 *
 * NOT the panel path. `.cr-panel__bleed` stays pure CSS on purpose — drip.css
 * records that the house glitch must stay script-free and SSR-identical, and
 * that a seeded canvas painter is the direction an earlier regression drifted
 * from. This component is a deliberate reach for a hero surface, never the
 * default way a panel gets grain.
 *
 * Law 6: hardware only. Never mount this on a flat content field.
 * See references/decoration.md. */
export default function CrDither(props: CrDitherProps) {
  const canvasRef = useRef(null);

  const state = useStore({
    paint() {
      const W = props.width || 160;
      const H = props.height || 96;
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
      const cv = (name: string, fb: string) => {
        try { const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; } catch (e) { return fb; }
      };
      /* Parse the token colour to RGB. Tokens resolve to hex in every shipped
       * theme; anything else falls back rather than painting a wrong colour. */
      const toRgb = (c: string, fb: number[]) => {
        const h = c.replace("#", "");
        if (h.length === 6) { const n = parseInt(h, 16); if (!isNaN(n)) return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
        if (h.length === 3) { const n = parseInt(h[0] + h[0] + h[1] + h[1] + h[2] + h[2], 16); if (!isNaN(n)) return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
        return fb;
      };

      const INK = [cv("--sig-work", "#00d3fb"), cv("--sig-accent", "#ff1a9d"), cv("--sig-accent-2", "#9ad335"), cv("--sig-done", "#00deaa"), cv("--sig-wait", "#f9ad00")];
      const stateHue: any = { working: cv("--sig-work", "#00d3fb"), waiting: cv("--sig-wait", "#f9ad00"), idle: cv("--sig-idle", "#848496"), error: cv("--sig-err", "#f45058"), done: cv("--sig-accent-2", "#9ad335") };
      const rng = mulberry32(hashSeed(props.seed));
      const ink = props.state ? stateHue[props.state] : INK[Math.floor(rng() * INK.length)];
      const ground = cv("--board", "#0a0a12");

      const node: any = canvasRef;
      if (!node || !node.getContext) return;
      const ctx = node.getContext("2d");
      if (!ctx) return;
      node.width = W; node.height = H;
      node.style.width = W + "px"; node.style.height = H + "px";
      ctx.imageSmoothingEnabled = false;

      /* The seed shifts the ramp's phase and direction, so two seeds give
       * visibly different fields rather than the same gradient twice.
       * Block comments deliberately: the Mitosis codegen collapses everything
       * after this point onto one line, and a `//` comment there swallows the
       * rest of paint() — a silent, compile-breaking corruption. */
      const flip = rng() > 0.5;
      const phase = rng() * 0.35;

      /* Two flat guarded branches rather than one if/else: the Mitosis codegen
       * mangles a top-level if/else inside a useStore method, collapsing the
       * body onto one line with unbalanced braces. CrSigil's paint() is flat
       * for the same reason. Keep it flat. */
      const halftone = (props.mode || "bayer") === "halftone";

      /* Variable-density dots: radius tracks the ramp value. */
      if (halftone) {
        const g = 6;
        ctx.fillStyle = ground; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = ink;
        for (let y = g / 2; y < H; y += g) {
          for (let x = g / 2; x < W; x += g) {
            const t = Math.min(1, Math.max(0, (flip ? 1 - x / W : x / W) + phase));
            const r = t * (g * 0.62);
            if (r > 0) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
          }
        }
      }

      /* Bayer 4x4 ordered dither — a 1-bit decision per pixel. */
      if (!halftone) {
        const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
        const lo = toRgb(ground, [10, 10, 18]);
        const hi = toRgb(ink, [0, 211, 251]);
        const img = ctx.createImageData(W, H);
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const t = Math.min(1, Math.max(0, (flip ? 1 - x / (W - 1) : x / (W - 1)) + phase));
            const th = (BAYER[y & 3][x & 3] + 0.5) / 16;
            const c = t > th ? hi : lo;
            const o = (y * W + x) * 4;
            img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
          }
        }
        ctx.putImageData(img, 0, 0);
      }
    },
  });

  onMount(() => {
    state.paint();
  });
  onUpdate(() => {
    state.paint();
  }, [props.seed, props.mode, props.state, props.width, props.height]);

  return <canvas ref={canvasRef} class="cr-dither" role="img" aria-label={props.seed + " dither field"} />;
}
