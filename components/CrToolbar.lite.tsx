import { useStore, useRef, onMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrToolbarProps {
  label: string;
  /** `horizontal` (default) uses ←/→; `vertical` uses ↑/↓. */
  orientation?: "horizontal" | "vertical";
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Part: "root". Wraps your own controls (buttons, links, fields) as children. */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

const FOCUSABLE =
  'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/* A WAI-ARIA toolbar — a labelled group of controls with a single tab stop and
 * roving-tabindex arrow navigation (←/→ or ↑/↓ by orientation, Home/End to the
 * ends). Enter/Space still activate the focused control natively. Wrap your own
 * buttons/links/fields as children; the first is made the tab stop on mount and
 * the arrows move focus and the stop together. Styling via .cr-toolbar; data-part
 * on root. */
export default function CrToolbar(props: CrToolbarProps) {
  const rootRef = useRef<any>(null);

  const state = useStore({
    items(): any[] {
      return rootRef ? Array.from(rootRef.querySelectorAll(FOCUSABLE)) : [];
    },
    // Make exactly the first control the tab stop; the rest are removed from the
    // tab order. Roving on keydown recomputes from there.
    setStop(next: number) {
      const els = state.items();
      els.forEach((el: any, j: number) => el.setAttribute("tabindex", j === next ? "0" : "-1"));
    },
    onKey(event: any) {
      const vertical = props.orientation === "vertical";
      const nextKey = vertical ? "ArrowDown" : "ArrowRight";
      const prevKey = vertical ? "ArrowUp" : "ArrowLeft";
      const els = state.items();
      if (!els.length) return;
      const i = els.indexOf(event.target);
      let next = -1;
      if (event.key === nextKey) next = i < 0 ? 0 : (i + 1) % els.length;
      else if (event.key === prevKey) next = i < 0 ? 0 : (i - 1 + els.length) % els.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = els.length - 1;
      if (next >= 0) {
        event.preventDefault();
        state.setStop(next);
        (els[next] as HTMLElement).focus();
      }
    },
  });

  onMount(() => {
    state.setStop(0);
  });

  return (
    <div
      {...ptAttrs(props.pt, "root")}
      ref={rootRef}
      data-part="root"
      class={ptClass(props.pt, props.unstyled, "cr-toolbar", "root")}
      style={ptStyle(props.pt, props.dt, "root")}
      role="toolbar"
      aria-label={props.label}
      aria-orientation={props.orientation === "vertical" ? "vertical" : "horizontal"}
      onKeyDown={(event) => state.onKey(event)}
    >
      {props.children}
    </div>
  );
}
