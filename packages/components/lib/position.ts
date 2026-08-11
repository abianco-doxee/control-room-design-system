/* Collision-aware anchored positioning for overlay components (popover, menu,
 * tooltip, hover card, combobox list). Places a floating element against an
 * anchor with a preferred `placement`, FLIPS to the opposite side when there
 * isn't room, and SHIFTS along the cross axis to stay in the viewport.
 *
 * This is a DELIBERATE PORT of `@alebianco/cr-utils/position`. Components are
 * authored as Mitosis `.lite.tsx` and compiled to six frameworks, so they may
 * only import from `../lib/` — a cross-package import would not resolve across
 * every target. The logic is therefore duplicated here on purpose.
 *
 * `tests/position-port.test.mjs` runs both copies over the same cases and
 * asserts they agree — that test is what stops the two drifting. If it fails,
 * THIS file is wrong; `packages/utils/position.js` is the reference. */

export interface RectLike {
  x?: number;
  left?: number;
  y?: number;
  top?: number;
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface PositionOptions {
  /** preferred placement, e.g. "bottom-start" (default). `${side}-${align}`. */
  placement?: string;
  /** gap between anchor and floating element, px (default 6). */
  offset?: number;
  /** min distance from the viewport edge, px (default 8). */
  padding?: number;
  /** flip to the opposite side when there isn't room (default true). */
  flip?: boolean;
  /** shift along the cross axis to stay in view (default true). */
  shift?: boolean;
}

export interface Position {
  x: number;
  y: number;
  /** the final placement after any flip, `${side}-${align}`. */
  placement: string;
}

const OPPOSITE: any = { top: "bottom", bottom: "top", left: "right", right: "left" };

/**
 * Pure placement math. `anchor` and `floating` are DOMRect-likes
 * ({ x|left, y|top, width, height }); `viewport` is { width, height }.
 * `opts`: { placement="bottom-start", offset=6, padding=8, flip=true, shift=true }.
 * Returns { x, y, placement } — viewport (fixed) coordinates + the final placement.
 */
export function computePosition(
  anchor: RectLike,
  floating: RectLike,
  viewport: Viewport,
  opts: PositionOptions = {}
): Position {
  const offset = opts.offset ?? 6;
  const padding = opts.padding ?? 8;
  const flip = opts.flip !== false;
  const shift = opts.shift !== false;
  const parts = (opts.placement || "bottom-start").split("-");
  const prefSide = parts[0];
  const align = parts[1] === undefined ? "start" : parts[1];

  const ax = (anchor.x ?? anchor.left) as number;
  const ay = (anchor.y ?? anchor.top) as number;
  const aw = anchor.width;
  const ah = anchor.height;
  const fw = floating.width;
  const fh = floating.height;
  const vw = viewport.width;
  const vh = viewport.height;

  const roomFor = (side: string): number => {
    if (side === "bottom") return vh - (ay + ah);
    if (side === "top") return ay;
    if (side === "right") return vw - (ax + aw);
    return ax; // left
  };
  const need = (side: string): number => (side === "top" || side === "bottom" ? fh : fw) + offset;

  // flip to the opposite side if the preferred one can't fit but its opposite can
  let side = prefSide;
  if (flip && roomFor(side) < need(side) && roomFor(OPPOSITE[side]) > roomFor(side)) {
    side = OPPOSITE[side];
  }

  const vertical = side === "top" || side === "bottom";
  let x: number;
  let y: number;
  if (vertical) {
    y = side === "bottom" ? ay + ah + offset : ay - fh - offset;
    x = align === "end" ? ax + aw - fw : align === "center" ? ax + aw / 2 - fw / 2 : ax;
  } else {
    x = side === "right" ? ax + aw + offset : ax - fw - offset;
    y = align === "end" ? ay + ah - fh : align === "center" ? ay + ah / 2 - fh / 2 : ay;
  }

  // shift along the cross axis so the floating element stays within the viewport
  if (shift) {
    if (vertical) x = Math.max(padding, Math.min(x, vw - fw - padding));
    else y = Math.max(padding, Math.min(y, vh - fh - padding));
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    placement: `${side}-${align}`,
  };
}

/** Apply computePosition to real elements (position: fixed). Returns the final placement. */
export function placeEl(anchorEl: any, floatingEl: any, opts?: PositionOptions): string {
  if (typeof window === "undefined" || !anchorEl || !floatingEl) return "";
  const a = anchorEl.getBoundingClientRect();
  const f = floatingEl.getBoundingClientRect();
  const p = computePosition(a, f, { width: window.innerWidth, height: window.innerHeight }, opts);
  floatingEl.style.position = "fixed";
  floatingEl.style.margin = "0";
  floatingEl.style.left = `${p.x}px`;
  floatingEl.style.top = `${p.y}px`;
  floatingEl.setAttribute("data-placement", p.placement);
  return p.placement;
}
