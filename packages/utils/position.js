// Collision-aware anchored positioning — a tiny Floating-UI-lite for overlays
// (popover, menu, tooltip, hover card, combobox list). Places a floating element
// against an anchor with a preferred `placement`, FLIPS to the opposite side when
// there isn't room, and SHIFTS along the cross axis to stay in the viewport.
//
// `computePosition` is pure geometry (rects in, coords out) so it's fully unit-
// testable; `place` / `autoPlace` apply it to real DOM (position: fixed) and, for
// autoPlace, keep it pinned on scroll/resize. Framework-agnostic, dependency-free.

const OPPOSITE = { top: "bottom", bottom: "top", left: "right", right: "left" };

/**
 * Pure placement math. `anchor` and `floating` are DOMRect-likes
 * ({ x|left, y|top, width, height }); `viewport` is { width, height }.
 * `opts`: { placement="bottom-start", offset=6, padding=8, flip=true, shift=true }.
 * Returns { x, y, placement } — viewport (fixed) coordinates + the final placement.
 */
export function computePosition(anchor, floating, viewport, opts = {}) {
  const offset = opts.offset ?? 6;
  const padding = opts.padding ?? 8;
  const flip = opts.flip !== false;
  const shift = opts.shift !== false;
  const [prefSide, align = "start"] = (opts.placement || "bottom-start").split("-");

  const ax = anchor.x ?? anchor.left;
  const ay = anchor.y ?? anchor.top;
  const aw = anchor.width;
  const ah = anchor.height;
  const fw = floating.width;
  const fh = floating.height;
  const vw = viewport.width;
  const vh = viewport.height;

  const roomFor = (side) => {
    if (side === "bottom") return vh - (ay + ah);
    if (side === "top") return ay;
    if (side === "right") return vw - (ax + aw);
    return ax; // left
  };
  const need = (side) => (side === "top" || side === "bottom" ? fh : fw) + offset;

  // flip to the opposite side if the preferred one can't fit but its opposite can
  let side = prefSide;
  if (flip && roomFor(side) < need(side) && roomFor(OPPOSITE[side]) > roomFor(side)) {
    side = OPPOSITE[side];
  }

  const vertical = side === "top" || side === "bottom";
  let x;
  let y;
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

/** Apply computePosition to real elements (position: fixed). Returns { x, y, placement }. */
export function place(anchorEl, floatingEl, opts = {}) {
  const vp = { width: window.innerWidth, height: window.innerHeight };
  const pos = computePosition(
    anchorEl.getBoundingClientRect(),
    floatingEl.getBoundingClientRect(),
    vp,
    opts
  );
  floatingEl.style.position = "fixed";
  floatingEl.style.left = pos.x + "px";
  floatingEl.style.top = pos.y + "px";
  floatingEl.style.margin = "0";
  floatingEl.setAttribute("data-placement", pos.placement);
  return pos;
}

/** place() now, and keep it pinned while scrolling/resizing. Returns a cleanup fn. */
export function autoPlace(anchorEl, floatingEl, opts = {}) {
  const run = () => place(anchorEl, floatingEl, opts);
  run();
  window.addEventListener("scroll", run, true);
  window.addEventListener("resize", run);
  return () => {
    window.removeEventListener("scroll", run, true);
    window.removeEventListener("resize", run);
  };
}
