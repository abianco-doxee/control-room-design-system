import { onMount, onUpdate, useRef, useStore } from "@builder.io/mitosis";

export interface CrChromeProps {
  /** Same seed → same hardware strip (deterministic variance). */
  seed: string;
  /** Strip width in px (height is fixed at 26). */
  width?: number;
}

/** Seeded chrome strip — a pixel-art instrument bar with a deterministically
 * varied graduated scale (index ticks + taller major graduations), panel seams,
 * registration marks, wear scratches, and one indicator LED. Decorative hardware
 * detail (Law 6); aria-hidden. Imperative canvas repainted on mount and whenever
 * seed/width change; Mitosis resolves the ref per target.
 *
 * Deliberately NOT nuts-and-bolts: this used to paint literal rivets, hex bolts
 * and slot/phillips screw heads, which read as a novelty machine-panel skin
 * rather than as an instrument. The vocabulary is now measurement marks — the
 * face of a gauge, not its fixings. Keep it that way: no screw heads, no bolts.
 * See references/components.md#seeded-chrome. */
export default function CrChrome(props: CrChromeProps) {
  const canvasRef = useRef(null);

  const state = useStore({
    paint() {
      const W = props.width || 220;
      const H = 26;
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
      const cv = (name: string, fb: string) => {
        try { const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; } catch (e) { return fb; }
      };
      const LED = [cv("--sig-work", "#00d3fb"), cv("--sig-wait", "#f9ad00"), cv("--sig-accent-2", "#9ad335"), cv("--sig-err", "#f45058"), cv("--sig-accent", "#ff1a9d")];
      /* metal palette derived from theme surfaces so the strip themes with the system */
      const HI = cv("--rail-ink", "#3a3550"), MID = cv("--panel-2", "#2a2740"), LO = cv("--rail", "#17141f"), EDGE = cv("--border", "#000000"), SCR = cv("--muted", "#4a4560");

      const node: any = canvasRef;
      if (!node || !node.getContext) return;
      const dpr = Math.max(1, Math.min(3, (typeof window !== "undefined" && window.devicePixelRatio) || 1));
      node.width = W * dpr; node.height = H * dpr; node.style.width = W + "px"; node.style.height = H + "px";
/* getContext can THROW or return null where 2D is unavailable — a headless
       * DOM, a canvas-blocking privacy mode, an exhausted context pool. Painting
       * is decorative here, so bail out instead of taking the render down. */
      let ctx: any = null;
      try { ctx = node.getContext("2d"); } catch { ctx = null; }
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false; ctx.scale(dpr, dpr);

      // two-tone metal bar (hard boundary — lit top half, dark bottom half; Law 1)
      ctx.fillStyle = MID; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = HI; ctx.fillRect(0, 0, W, 2);
      ctx.fillStyle = LO; ctx.fillRect(0, H - Math.round(H * 0.42), W, Math.round(H * 0.42));
      ctx.fillStyle = EDGE; ctx.fillRect(0, 0, W, 1); ctx.fillRect(0, H - 1, W, 1);

      // wear scratches — a few faint light diagonals
      const scratches = 2 + Math.floor(rng() * 3);
      ctx.strokeStyle = SCR; ctx.lineWidth = 1;
      for (let i = 0; i < scratches; i++) {
        const x = Math.floor(rng() * W), len = 6 + Math.floor(rng() * 16);
        ctx.globalAlpha = 0.4 + rng() * 0.3;
        ctx.beginPath(); ctx.moveTo(x, 4 + rng() * (H - 10)); ctx.lineTo(x + len, 4 + rng() * (H - 10)); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // a graduation: a 1px etched tick, lit on its left edge so it reads as cut in
      const tick = (x: number, h: number) => {
        const y = Math.round((H - h) / 2);
        ctx.fillStyle = EDGE; ctx.fillRect(x, y, 1, h);
        ctx.fillStyle = HI; ctx.globalAlpha = 0.5; ctx.fillRect(x + 1, y, 1, h); ctx.globalAlpha = 1;
      };

      // graduated scale — evenly pitched minor ticks with a seeded major interval.
      // Even pitch is correct HERE (unlike the drip): a measuring scale is regular
      // by definition; the seeded variance is in the pitch, the major interval and
      // the major tick height, not in jitter.
      const pad = 12;
      const pitch = 6 + Math.floor(rng() * 4);        // 6–9px between minor ticks
      const major = 4 + Math.floor(rng() * 3);        // every 4th–6th tick is major
      const majorH = 11 + Math.floor(rng() * 5);      // 11–15px
      const phase = Math.floor(rng() * major);
      for (let x = pad, i = 0; x <= W - pad; x += pitch, i++) {
        tick(Math.round(x), (i + phase) % major === 0 ? majorH : 4);
      }

      // 1–2 panel seams (vertical grooves) — the one structural mark that stays
      const seams = 1 + Math.floor(rng() * 2);
      for (let i = 0; i < seams; i++) {
        const x = Math.round(pad + rng() * (W - pad * 2));
        ctx.fillStyle = EDGE; ctx.fillRect(x, 2, 1, H - 4); ctx.fillStyle = HI; ctx.fillRect(x + 1, 2, 1, H - 4);
      }

      // one registration mark (Signature 7: an L-shaped crop tick, ink weight only,
      // never a signal hue — a signal hue here would fake a machine state)
      const rx = Math.round(pad + rng() * (W - pad * 2 - 8));
      ctx.fillStyle = EDGE;
      ctx.fillRect(rx, 4, 5, 1); ctx.fillRect(rx, 4, 1, 5);

      // one indicator LED near an end (seeded colour)
      const led = LED[Math.floor(rng() * LED.length)];
      const lx = rng() > 0.5 ? W - 8 : 8;
      ctx.fillStyle = EDGE; ctx.fillRect(lx - 3, H / 2 - 3, 6, 6);
      ctx.fillStyle = led; ctx.fillRect(lx - 2, H / 2 - 2, 4, 4);
      ctx.fillStyle = "#fff"; ctx.globalAlpha = 0.6; ctx.fillRect(lx - 2, H / 2 - 2, 1, 1); ctx.globalAlpha = 1;
    },
  });

  onMount(() => {
    state.paint();
  });
  onUpdate(() => {
    state.paint();
  }, [props.seed, props.width]);

  return <canvas ref={canvasRef} role="img" aria-label={props.seed + " hardware"} />;
}
