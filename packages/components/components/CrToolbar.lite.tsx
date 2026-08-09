import { useStore, useRef, onMount, Show, For } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrToolbarItem {
  id: string;
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  /** Render in the error hue in the overflow menu (destructive action). */
  danger?: boolean;
}

export interface CrToolbarProps {
  label: string;
  /** `horizontal` (default) uses ←/→; `vertical` uses ↑/↓ (children mode only). */
  orientation?: "horizontal" | "vertical";
  /** Data-driven mode: render these as bar buttons. Enables `overflow`. */
  items?: CrToolbarItem[];
  /** With `items`: collapse the buttons that don't fit into a "⋯ more" menu
   *  instead of letting them wrap/overflow (priority+ pattern). */
  overflow?: boolean;
  /** Simple mode: wrap your own controls as children (roving tabindex, no menu). */
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "item" · "more" · "menu" · "menuitem". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

const FOCUSABLE =
  'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/* A WAI-ARIA toolbar — a labelled group of controls with a single tab stop and
 * roving-tabindex arrow navigation (Home/End to the ends; Enter/Space activate).
 * Two modes:
 *   • children  — wrap your own buttons/links/fields; roving over whatever you pass.
 *   • items[]   — data-driven bar buttons; with `overflow`, the buttons that don't
 *     fit collapse into a "⋯ more" menu (priority+), measured live via
 *     ResizeObserver. SSR / no-JS renders every item in the bar (all actions stay
 *     reachable), then the measure pass moves the overflow into the menu.
 * Styling via .cr-toolbar; data-part per part. */
export default function CrToolbar(props: CrToolbarProps) {
  const rootRef = useRef<any>(null);

    const state = useStore({
    // items mode: how many items are shown in the bar (the rest go to the menu).
    // Starts at "all" so the first paint (and SSR) shows everything.
    visible: props.items ? props.items.length : 0,
    menuOpen: false,

    get overflowItems(): CrToolbarItem[] {
      return props.items ? props.items.slice(state.visible) : [];
    },
    get moreLabel(): string {
      return "More actions, " + state.overflowItems.length + " hidden";
    },
    hiddenAt(i: number): boolean {
      return props.overflow ? i >= state.visible : false;
    },

    // ── priority+ measurement ────────────────────────────────────────────────
    // Mitosis compiles useStore fields to per-framework state (React useState),
    // so a width array can't be written-then-read in the same pass, and the
    // onMount closure never sees a "measured" flag flip. So the DOM is the store:
    // each item's natural width is stamped onto a data-w attribute ONCE (while all
    // items are visible), and it survives display:none — synchronous, closure-immune.
    measure() {
      const root: any = rootRef;
      if (!root || !props.items || !props.overflow) return;
      const bar = root;
      const btns: any[] = Array.from(bar.querySelectorAll("[data-tb-item]"));
      if (btns.length !== props.items.length) return; // not all rendered yet
      // capture each natural width once (only when the button is actually laid out)
      for (const b of btns) {
        if (!b.getAttribute("data-w")) {
          const r = b.getBoundingClientRect().width;
          if (r > 0) b.setAttribute("data-w", "" + r);
        }
      }
      const w = btns.map((b: any) => parseFloat(b.getAttribute("data-w") || "0"));
      let capturedAll = true;
      for (let i = 0; i < w.length; i++) if (!w[i]) capturedAll = false;
      if (!capturedAll) return; // widths not all captured yet — retry next tick/resize
      const cs = getComputedStyle(bar);
      const gap = parseFloat(cs.columnGap || cs.gap || "0") || 0;
      const padL = parseFloat(cs.paddingLeft || "0") || 0;
      const padR = parseFloat(cs.paddingRight || "0") || 0;
      const avail = bar.clientWidth - padL - padR;
      if (avail <= 0) return; // not laid out yet — leave the current (all-visible) count
      let sumAll = 0;
      for (let i = 0; i < w.length; i++) sumAll += w[i] + (i > 0 ? gap : 0);
      if (sumAll <= avail) {
        state.visible = w.length; // everything fits — no menu
        return;
      }
      const reserve = 52 + gap; // room the "⋯ more" button needs
      let used = 0;
      let count = 0;
      for (let i = 0; i < w.length; i++) {
        const add = w[i] + (i > 0 ? gap : 0);
        if (used + add + reserve <= avail) {
          used += add;
          count++;
        } else break;
      }
      state.visible = count;
    },

    // ── overflow menu ──────────────────────────────────────────────────────
    toggleMenu() {
      state.menuOpen = !state.menuOpen;
    },
    closeMenu() {
      state.menuOpen = false;
    },
    focusMore() {
      const root: any = rootRef;
      const t = root ? root.querySelector("[data-tb-more]") : null;
      if (t) t.focus();
    },
    focusFirstMenuItem(tries: number) {
      const root: any = rootRef;
      const first = root ? root.querySelector('[role="menuitem"]') : null;
      if (first) {
        first.focus();
        return;
      }
      if ((tries || 0) < 6) setTimeout(() => state.focusFirstMenuItem((tries || 0) + 1), 16);
    },
    pickMenu(item: CrToolbarItem) {
      if (item.disabled) return;
      state.menuOpen = false;
      state.focusMore();
      if (item.onSelect) item.onSelect();
    },
    onMoreKey(e: any) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        state.menuOpen = true;
        state.focusFirstMenuItem(0);
      }
    },
    onMenuKey(e: any) {
      const root: any = rootRef;
      if (!root) return;
      const items = Array.from(root.querySelectorAll('[role="menuitem"]'));
      const i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        ((items[i + 1] || items[0]) as HTMLElement).focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        ((items[i - 1] || items[items.length - 1]) as HTMLElement).focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        (items[0] as HTMLElement).focus();
      } else if (e.key === "End") {
        e.preventDefault();
        (items[items.length - 1] as HTMLElement).focus();
      } else if (e.key === "Escape") {
        e.preventDefault();
        state.menuOpen = false;
        state.focusMore();
      }
    },

    // ── roving tabindex across the visible bar controls ──────────────────────
    barItems(): any[] {
      const root: any = rootRef;
      if (!root) return [];
      const bar = root.querySelector('[data-part="root"]') || root;
      return props.items
        ? Array.from(bar.querySelectorAll("[data-tb-item]:not([hidden]),[data-tb-more]"))
        : Array.from(bar.querySelectorAll(FOCUSABLE));
    },
    setStop(next: number) {
      const els = state.barItems();
      els.forEach((el: any, j: number) => el.setAttribute("tabindex", j === next ? "0" : "-1"));
    },
    onKey(e: any) {
      const vertical = props.orientation === "vertical";
      const nextKey = vertical ? "ArrowDown" : "ArrowRight";
      const prevKey = vertical ? "ArrowUp" : "ArrowLeft";
      const els = state.barItems();
      if (!els.length) return;
      const i = els.indexOf(e.target);
      let next = -1;
      if (e.key === nextKey) next = i < 0 ? 0 : (i + 1) % els.length;
      else if (e.key === prevKey) next = i < 0 ? 0 : (i - 1 + els.length) % els.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = els.length - 1;
      if (next >= 0) {
        e.preventDefault();
        state.setStop(next);
        (els[next] as HTMLElement).focus();
      }
    },
  });

  onMount(() => {
    state.measure();
    // remeasure after layout/fonts settle, then on every container resize.
    setTimeout(() => {
      state.measure();
      state.setStop(0);
    }, 32);
    const root: any = rootRef;
    if (root && typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => {
        state.measure();
        state.setStop(0);
      });
      ro.observe(root);
    }
  });

  return (
    <div
      {...ptAttrs(props.pt, "root")}
      ref={rootRef}
      data-part="root"
      class={ptClass(props.pt, props.unstyled, "cr-toolbar" + (props.items && props.overflow ? " cr-toolbar--overflow" : ""), "root")}
      style={ptStyle(props.pt, props.dt, "root")}
      role="toolbar"
      aria-label={props.label}
      aria-orientation={props.orientation === "vertical" ? "vertical" : "horizontal"}
      onKeyDown={(event) => state.onKey(event)}
    >
      <Show when={props.items} else={props.children}>
        <For each={props.items}>
          {(item: CrToolbarItem, i: number) => (
            <button
              {...ptAttrs(props.pt, "item")}
              type="button"
              data-tb-item="1"
              data-part="item"
              hidden={state.hiddenAt(i)}
              disabled={item.disabled}
              class={ptClass(props.pt, props.unstyled, "cr-toolbar__item cr-btn cr-btn--outline cr-btn--sm", "item")}
              tabIndex={-1}
              onClick={() => item.onSelect && item.onSelect()}
            >
              {item.label}
            </button>
          )}
        </For>

        <Show when={props.overflow && state.overflowItems.length > 0}>
          <div class="cr-toolbar__more-wrap" data-state={state.menuOpen ? "open" : "closed"}>
            <button
              {...ptAttrs(props.pt, "more")}
              type="button"
              data-tb-more="1"
              data-part="more"
              class={ptClass(props.pt, props.unstyled, "cr-toolbar__more cr-btn cr-btn--outline cr-btn--sm", "more")}
              aria-haspopup="menu"
              aria-expanded={state.menuOpen ? "true" : "false"}
              aria-label={state.moreLabel}
              tabIndex={-1}
              onClick={() => state.toggleMenu()}
              onKeyDown={(event) => state.onMoreKey(event)}
            >
              <span aria-hidden="true">⋯</span>
            </button>
            <Show when={state.menuOpen}>
              <button type="button" class="cr-menu__scrim" aria-hidden="true" tabIndex={-1} onClick={() => state.closeMenu()} />
              <div
                {...ptAttrs(props.pt, "menu")}
                data-part="menu"
                class={ptClass(props.pt, props.unstyled, "cr-menu__panel cr-menu__panel--right", "menu")}
                role="menu"
                onKeyDown={(event) => state.onMenuKey(event)}
              >
                <For each={state.overflowItems}>
                  {(item: CrToolbarItem) => (
                    <button
                      {...ptAttrs(props.pt, "menuitem")}
                      type="button"
                      role="menuitem"
                      data-part="menuitem"
                      disabled={item.disabled}
                      class={ptClass(props.pt, props.unstyled, "cr-menu__item" + (item.danger ? " cr-menu__item--danger" : ""), "menuitem")}
                      onClick={() => state.pickMenu(item)}
                    >
                      {item.label}
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Show>
      </Show>
    </div>
  );
}
