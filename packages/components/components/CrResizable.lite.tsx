import { useStore, useRef, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptAttrs, ptClass, ptHandler, ptResolve, ptStyle, resolveMessage, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrResizableProps {
  /** Split axis: "horizontal" (default, side-by-side) · "vertical" (stacked). */
  orientation?: string;
  /** Initial size of the leading pane, in percent (default 50). */
  defaultSize?: number;
  /** Clamp for the leading pane, in percent (defaults 10 / 90). */
  min?: number;
  max?: number;
  /** Accessible name for the drag handle. */
  label?: string;
  /** Exactly TWO panes — the leading (left/top) and trailing (right/bottom). */
  children?: any;
  /** Override this component's built-in English strings. See lib/messages.ts. */
  labels?: Record<string, any>;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "separator". */
  unstyled?: boolean;
  pt?: CrPassThrough<"root" | "separator">;
  dt?: CrDesignTokens;
}

/* Resizable — two panes with a draggable divider. Pass the two panes as children
 * (a CSS grid sizes the first to the split, the second fills the rest); the handle
 * is overlaid at the split line so no markup is injected between your panes. The
 * handle is a WAI-ARIA window splitter: role="separator", focusable, with
 * aria-orientation + aria-valuenow/min/max reflecting the leading pane's percent;
 * ←/→ (or ↑/↓) resize by 2%, Home/End jump to the clamps. Dragging uses pointer
 * capture — no global listeners, and it can't get stuck. Styling via .cr-resizable. */
export default function CrResizable(props: CrResizableProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrResizable"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrResizable"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrResizable"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  const rootRef = useRef(null);

  const state = useStore({
    size: props.defaultSize || 50,
    /* Angular templates cannot reach globals, so `Math.round(size)` inline is
     * "Property 'Math' does not exist" under AOT. Rounding here keeps the
     * template to a property read, which every target can express. */
    sizeRounded(): number {
      return Math.round(state.size);
    },
    dragging: false,
    lo(): number {
      return props.min == null ? 10 : props.min;
    },
    hi(): number {
      return props.max == null ? 90 : props.max;
    },
    clamp(v: number): number {
      const loV = state.lo();
      const hiV = state.hi();
      return v < loV ? loV : v > hiV ? hiV : v;
    },
    isVertical(): boolean {
      return props.orientation === "vertical";
    },
    trackStyle(): any {
      return state.isVertical() ? { gridTemplateRows: state.size + "% 1fr" } : { gridTemplateColumns: state.size + "% 1fr" };
    },
    handleStyle(): any {
      return state.isVertical() ? { top: state.size + "%" } : { left: state.size + "%" };
    },
    setFromPointer(event: any) {
      const root: any = rootRef;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const pct = state.isVertical() ? ((event.clientY - rect.top) / rect.height) * 100 : ((event.clientX - rect.left) / rect.width) * 100;
      state.size = state.clamp(pct);
    },
    onPointerDown(event: any) {
      if (event.target && event.target.setPointerCapture) event.target.setPointerCapture(event.pointerId);
      state.dragging = true;
    },
    onPointerMove(event: any) {
      if (state.dragging) state.setFromPointer(event);
    },
    onPointerUp(event: any) {
      if (event.target && event.target.releasePointerCapture) {
        try {
          event.target.releasePointerCapture(event.pointerId);
        } catch (e) {}
      }
      state.dragging = false;
    },
    onKeyDown(event: any) {
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        state.size = state.clamp(state.size - 2);
      } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        state.size = state.clamp(state.size + 2);
      } else if (event.key === "Home") {
        event.preventDefault();
        state.size = state.lo();
      } else if (event.key === "End") {
        event.preventDefault();
        state.size = state.hi();
      }
    },
  });

  return (
    <div
      {...ptAttrs(ptResolve(cr, props.pt, "CrResizable"), "root")}
      class={ptClass(ptResolve(cr, props.pt, "CrResizable"), props.unstyled, "cr-resizable" + (props.orientation === "vertical" ? " cr-resizable--vertical" : ""), "root")}
      data-part="root"
      data-state={state.dragging ? "dragging" : "idle"}
      ref={rootRef}
      data-dragging={state.dragging ? "true" : undefined}
      style={{ ...state.trackStyle(), ...ptStyle(ptResolve(cr, props.pt, "CrResizable"), props.dt, "root") }}
    >
      {props.children}
      <div
        {...ptAttrs(ptResolve(cr, props.pt, "CrResizable"), "separator")}
        class={ptClass(ptResolve(cr, props.pt, "CrResizable"), props.unstyled, "cr-resizable__handle", "separator")}
        data-part="separator"
        data-state={state.dragging ? "dragging" : "idle"}
        role="separator"
        tabIndex={0}
        aria-orientation={props.orientation === "vertical" ? "horizontal" : "vertical"}
        aria-label={props.label || resolveMessage(cr, props.labels, "CrResizable", "resize")}
        aria-valuenow={state.sizeRounded()}
        aria-valuemin={state.lo()}
        aria-valuemax={state.hi()}
        style={state.handleStyle()}
        onPointerDown={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrResizable'), 'separator', 'onPointerDown', event); state.onPointerDown(event); }}
        onPointerMove={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrResizable'), 'separator', 'onPointerMove', event); state.onPointerMove(event); }}
        onPointerUp={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrResizable'), 'separator', 'onPointerUp', event); state.onPointerUp(event); }}
        onKeyDown={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrResizable'), 'separator', 'onKeyDown', event); state.onKeyDown(event); }}
      ></div>
    </div>
  );
}
