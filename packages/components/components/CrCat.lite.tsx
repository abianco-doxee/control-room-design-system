import { onMount, onUpdate, useRef, useStore } from "@builder.io/mitosis";

export interface CrCatProps {
  seed: string;
  state: "working" | "waiting" | "idle" | "error" | "done";
  size?: number;
}

/** Seeded identity+state pixel-cat. Imperative canvas repainted on mount and
 * whenever seed/state/size change; Mitosis resolves the ref per target.
 * See references/seeded-cat.md for the full contract. */
export default function CrCat(props: CrCatProps) {
  const canvasRef = useRef(null);

  const state = useStore({
    paint() {
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
      const cv = (name: string, fb: string) => {
        try { const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; } catch (e) { return fb; }
      };
      const FUR = [cv("--sig-work", "#22d3ee"), cv("--sig-accent", "#ff2e97"), cv("--sig-done", "#5eead4"), cv("--sig-wait", "#fde047"), cv("--sig-accent-2", "#c6ff00"), cv("--sig-err", "#ff3b6b")];
      const eyeMap: any = { working: cv("--sig-work", "#22d3ee"), waiting: cv("--sig-wait", "#fde047"), idle: cv("--sig-idle", "#8a8aa6"), error: cv("--sig-err", "#ff3b6b"), done: cv("--sig-accent-2", "#c6ff00") };
      const rng = mulberry32(hashSeed(props.seed));
      const fur = FUR[Math.floor(rng() * FUR.length)];
      const eye = eyeMap[props.state];
      const m: any[] = Array.from({ length: G }, () => new Array(G).fill(null));
      const set = (x: number, y: number, c: any) => { if (x >= 0 && x < G && y >= 0 && y < G && c) m[y][x] = c; };
      const fill = (x0: number, y0: number, w: number, h: number, c: any) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, c); };
      const mir = (x: number, y: number, c: any) => { set(x, y, c); set(G - 1 - x, y, c); };
      if (props.state === "idle") {
        fill(3, 9, 10, 5, fur); mir(3, 8, fur); mir(4, 8, fur);
        set(5, 11, "#000"); set(6, 11, "#000"); set(9, 11, "#000"); set(10, 11, "#000"); fill(12, 12, 2, 2, fur);
      } else if (props.state === "working") {
        mir(4, 1, fur); mir(4, 2, fur); mir(5, 2, fur); fill(4, 3, 8, 5, fur); fill(5, 8, 6, 5, fur);
        mir(5, 5, eye); set(8, 6, "#000"); fill(11, 7, 2, 6, fur);
      } else if (props.state === "waiting") {
        mir(4, 2, fur); mir(5, 2, fur); fill(4, 3, 8, 5, fur); fill(5, 8, 6, 4, fur);
        mir(5, 5, eye); set(8, 6, "#000"); fill(4, 11, 8, 2, fur);
      } else if (props.state === "error") {
        mir(3, 3, fur); mir(3, 4, fur);
        for (let x = 3; x <= 12; x++) { const h = Math.round(5 - Math.abs(x - 7.5)); fill(x, 10 - h, 1, h + 1, fur); }
        fill(4, 6, 3, 3, fur); set(4, 7, eye); set(5, 7, "#000");
      } else {
        mir(4, 7, fur); mir(5, 6, fur); fill(3, 8, 10, 5, fur);
        set(5, 10, "#000"); set(6, 9, "#000"); set(9, 10, "#000"); set(10, 9, "#000"); fill(12, 10, 2, 2, fur);
      }
      const node: any = canvasRef;
      if (!node || !node.getContext) return;
      const dpr = Math.max(1, Math.min(3, (typeof window !== "undefined" && window.devicePixelRatio) || 1));
      const cell = Math.max(1, Math.round((px * dpr) / G)); const back = cell * G;
      node.width = back; node.height = back; node.style.width = px + "px"; node.style.height = px + "px";
/* getContext can THROW or return null where 2D is unavailable — a headless
       * DOM, a canvas-blocking privacy mode, an exhausted context pool. Painting
       * is decorative here, so bail out instead of taking the render down. */
      let ctx: any = null;
      try { ctx = node.getContext("2d"); } catch { ctx = null; }
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, back, back);
      for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) { if (!m[y][x]) continue; ctx.fillStyle = m[y][x]; ctx.fillRect(x * cell, y * cell, cell, cell); }
    },
  });

  onMount(() => {
    state.paint();
  });
  onUpdate(() => {
    state.paint();
  }, [props.seed, props.state, props.size]);

  return <canvas ref={canvasRef} role="img" aria-label={props.seed + " — " + props.state} />;
}
