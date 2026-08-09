import { useStore, For } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrRatingProps {
  /** Current rating (0..max). Controlled. */
  value?: number;
  /** Number of steps. Default 5. */
  max?: number;
  label?: string;
  onChange?: (value: number) => void;
  /** Read-only display (no radiogroup, no keyboard) — e.g. a score readout. */
  readonly?: boolean;
  disabled?: boolean;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "star". Law 2: the filled colour is the accent (a state),
   * retarget with dt={{ "--cr-rating-on": … }}. */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* A star-rating control. Interactive mode is a WAI-ARIA radiogroup with roving
 * tabindex (←/→/Home/End move + select, the value is the number of the focused
 * star); readonly mode is an inert img with an accessible-name score. The mark is
 * a geometric glyph (no icon font) whose fill encodes the value. Styling via
 * .cr-rating; data-part on root + each star. */
export default function CrRating(props: CrRatingProps) {
  const state = useStore({
    get count(): number {
      return props.max && props.max > 0 ? props.max : 5;
    },
    get stars(): number[] {
      const out: number[] = [];
      for (let i = 1; i <= state.count; i++) out.push(i);
      return out;
    },
    get current(): number {
      return props.value && props.value > 0 ? props.value : 0;
    },
    pick(v: number) {
      if (props.disabled || props.readonly) return;
      if (props.onChange) props.onChange(v);
    },
    tabbable(v: number): number {
      // The selected star is the tab stop; if none selected, the first is.
      const sel = state.current;
      if (sel >= 1) return v === sel ? 0 : -1;
      return v === 1 ? 0 : -1;
    },
    onKey(event: any) {
      if (props.disabled || props.readonly) return;
      const cur = state.current;
      let next = cur;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.min(state.count, cur + 1);
      else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.max(0, cur - 1);
      else if (event.key === "Home") next = 1;
      else if (event.key === "End") next = state.count;
      else return;
      event.preventDefault();
      state.pick(next);
      const group: any = event.currentTarget;
      const target = group.querySelector('[data-value="' + (next < 1 ? 1 : next) + '"]');
      if (target) target.focus();
    },
  });

  return (
    <div
      {...ptAttrs(props.pt, "root")}
      data-part="root"
      class={ptClass(props.pt, props.unstyled, "cr-rating" + (props.readonly ? " cr-rating--readonly" : ""), "root")}
      style={ptStyle(props.pt, props.dt, "root")}
      role={props.readonly ? "img" : "radiogroup"}
      aria-label={props.readonly ? (props.label || "rating") + ": " + state.current + " of " + state.count : props.label}
      aria-disabled={props.disabled ? "true" : undefined}
      onKeyDown={(event) => state.onKey(event)}
    >
      <For each={state.stars}>
        {(v: number) => (
          <button
            {...ptAttrs(props.pt, "star")}
            type="button"
            data-part="star"
            data-value={v}
            data-state={v <= state.current ? "on" : "off"}
            class={ptClass(props.pt, props.unstyled, "cr-rating__star", "star")}
            role={props.readonly ? undefined : "radio"}
            aria-checked={props.readonly ? undefined : v === state.current ? "true" : "false"}
            aria-label={String(v)}
            tabIndex={props.readonly ? -1 : state.tabbable(v)}
            disabled={props.disabled}
            aria-hidden={props.readonly ? "true" : undefined}
            onClick={() => state.pick(v)}
          >
            <span aria-hidden="true">{v <= state.current ? "◆" : "◇"}</span>
          </button>
        )}
      </For>
    </div>
  );
}
