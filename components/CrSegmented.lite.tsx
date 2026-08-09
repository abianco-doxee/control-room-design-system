import { useStore, For } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrSegmentedOption {
  value: string;
  label: string;
}

export interface CrSegmentedProps {
  options: CrSegmentedOption[];
  /** Selected value (controlled). */
  value?: string;
  label?: string;
  onChange?: (value: string) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "opt". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* Single-select segmented control — a connected button bar (role=radiogroup with
 * roving tabindex; ←/→/Home/End move + select). Visually distinct from a radio
 * group, same semantics. Styling via .cr-segmented. */
export default function CrSegmented(props: CrSegmentedProps) {
  const state = useStore({
    select(v: string) {
      if (props.onChange) props.onChange(v);
    },
    tabbable(i: number): number {
      const idx = props.options.findIndex((o: CrSegmentedOption) => o.value === props.value);
      const chosen = idx < 0 ? 0 : idx;
      return chosen === i ? 0 : -1;
    },
    onKey(event: any) {
      const active: any = document.activeElement;
      const group = active ? active.closest('[role="radiogroup"]') : null;
      if (!group) return;
      const opts = Array.from(group.querySelectorAll('[role="radio"]'));
      const i = opts.indexOf(active);
      let next = -1;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (i + 1) % opts.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (i - 1 + opts.length) % opts.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = opts.length - 1;
      if (next >= 0) {
        event.preventDefault();
        const el = opts[next] as HTMLElement;
        el.focus();
        const v = el.getAttribute("data-value");
        if (v) state.select(v);
      }
    },
  });

  return (
    <div {...ptAttrs(props.pt, "root")} data-part="root" class={ptClass(props.pt, props.unstyled, "cr-segmented", "root")} role="radiogroup" aria-label={props.label} style={ptStyle(props.pt, props.dt, "root")} onKeyDown={(event) => state.onKey(event)}>
      <For each={props.options}>
        {(opt: CrSegmentedOption, i: number) => (
          <button
            {...ptAttrs(props.pt, "opt")}
            type="button"
            role="radio"
            data-part="opt"
            data-state={props.value === opt.value ? "active" : "inactive"}
            class={ptClass(props.pt, props.unstyled, "cr-segmented__opt", "opt")}
            data-value={opt.value}
            aria-checked={props.value === opt.value ? "true" : "false"}
            tabIndex={state.tabbable(i)}
            onClick={() => state.select(opt.value)}
          >
            {opt.label}
          </button>
        )}
      </For>
    </div>
  );
}
