import { onMount, useRef } from "@builder.io/mitosis";

export interface CrChromeProps {
  /** Same seed → same hardware strip (deterministic variance). */
  seed: string;
  /** Strip width in px (height is fixed at 26). */
  width?: number;
}

/** Seeded hardware chrome strip — a pixel-art metal bar with deterministically
 * varied fasteners (rivets / hex bolts / slot + phillips screws), panel seams,
 * wear scratches, and one indicator LED. Decorative hardware detail (Law 6);
 * aria-hidden. Imperative canvas, painted in onMount (matches the cat/sigil).
 * See references/components.md#seeded-chrome. */
export default function CrChrome(props: CrChromeProps) {
  const canvasRef = useRef(null);

  onMount(() => {
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
    const LED = ["#00d3fb", "#f9ad00", "#9ad335", "#f45058", "#ff1a9d"];
    // metal palette
    const HI = "#3a3550", MID = "#2a2740", LO = "#17141f", EDGE = "#000", SCR = "#4a4560";

    const node: any = canvasRef;
    if (!node || !node.getContext) return;
    const dpr = Math.max(1, Math.min(3, (typeof window !== "undefined" && window.devicePixelRatio) || 1));
    node.width = W * dpr; node.height = H * dpr; node.style.width = W + "px"; node.style.height = H + "px";
    const ctx = node.getContext("2d"); ctx.imageSmoothingEnabled = false; ctx.scale(dpr, dpr);

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

    // a fastener with a lit top-left + shadowed bottom-right (reads as raised)
    const fastener = (cx: number, cy: number, kind: number) => {
      const r = 4;
      const disc = () => { ctx.fillStyle = EDGE; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = HI; ctx.beginPath(); ctx.arc(cx, cy, r - 1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = MID; ctx.beginPath(); ctx.arc(cx + 0.6, cy + 0.6, r - 1.6, 0, Math.PI * 2); ctx.fill(); };
      if (kind === 0) { disc(); } // round rivet
      else if (kind === 1) { // hex bolt
        ctx.fillStyle = EDGE; ctx.beginPath();
        for (let a = 0; a < 6; a++) { const ang = (Math.PI / 3) * a; const px = cx + Math.cos(ang) * r, py = cy + Math.sin(ang) * r; a ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = HI; ctx.beginPath();
        for (let a = 0; a < 6; a++) { const ang = (Math.PI / 3) * a; const px = cx + Math.cos(ang) * (r - 1.4), py = cy + Math.sin(ang) * (r - 1.4); a ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.closePath(); ctx.fill();
      } else if (kind === 2) { disc(); ctx.fillStyle = EDGE; ctx.fillRect(cx - r + 1, cy - 0.5, (r - 1) * 2, 1); } // slot screw
      else { disc(); ctx.fillStyle = EDGE; ctx.fillRect(cx - r + 1, cy - 0.5, (r - 1) * 2, 1); ctx.fillRect(cx - 0.5, cy - r + 1, 1, (r - 1) * 2); } // phillips
    };

    // seeded row of fasteners across the strip
    const n = Math.max(3, Math.round(W / (34 + rng() * 20)));
    const pad = 12;
    for (let i = 0; i < n; i++) {
      const cx = Math.round(pad + (i * (W - pad * 2)) / (n - 1));
      fastener(cx, Math.round(H / 2), Math.floor(rng() * 4));
    }

    // 0–2 panel seams (vertical grooves)
    const seams = Math.floor(rng() * 3);
    for (let i = 0; i < seams; i++) {
      const x = Math.round(pad + rng() * (W - pad * 2));
      ctx.fillStyle = EDGE; ctx.fillRect(x, 2, 1, H - 4); ctx.fillStyle = HI; ctx.fillRect(x + 1, 2, 1, H - 4);
    }

    // one indicator LED near an end (seeded colour)
    const led = LED[Math.floor(rng() * LED.length)];
    const lx = rng() > 0.5 ? W - 8 : 8;
    ctx.fillStyle = EDGE; ctx.fillRect(lx - 3, H / 2 - 3, 6, 6);
    ctx.fillStyle = led; ctx.fillRect(lx - 2, H / 2 - 2, 4, 4);
    ctx.fillStyle = "#fff"; ctx.globalAlpha = 0.6; ctx.fillRect(lx - 2, H / 2 - 2, 1, 1); ctx.globalAlpha = 1;
  });

  return <canvas ref={canvasRef} role="img" aria-label={props.seed + " hardware"} />;
}
