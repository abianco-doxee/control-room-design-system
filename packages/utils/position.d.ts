// Types for the collision-aware anchored positioning helper (see position.js).

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

/** Pure placement math: rects + viewport in, fixed-viewport coords out. */
export function computePosition(
  anchor: RectLike,
  floating: RectLike,
  viewport: Viewport,
  opts?: PositionOptions
): Position;

/** Apply computePosition to real elements (position: fixed). */
export function place(anchorEl: Element, floatingEl: HTMLElement, opts?: PositionOptions): Position;

/** place() now, and keep it pinned on scroll/resize. Returns a cleanup fn. */
export function autoPlace(
  anchorEl: Element,
  floatingEl: HTMLElement,
  opts?: PositionOptions
): () => void;
