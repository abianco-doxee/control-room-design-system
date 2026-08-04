import { useStore, For } from "@builder.io/mitosis";

export interface CrRadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CrRadioGroupProps {
  options: CrRadioOption[];
  /** Selected value (controlled). */
  value?: string;
  /** Lay the radios out in a row. */
  row?: boolean;
  label?: string;
  onChange?: (value: string) => void;
}

/* Radio group (role=radiogroup) with roving tabindex: only the checked radio (or
 * the first, if none) is tabbable; ↑/↓/←/→ move selection. Square radios (radius
 * 0 — a filled inner square marks the choice). Styling via .cr-radiogroup. */
export default function CrRadioGroup(props: CrRadioGroupProps) {
  const state = useStore({
    select(v: string) {
      if (props.onChange) props.onChange(v);
    },
    tabbable(i: number): number {
      const idx = props.options.findIndex((o: CrRadioOption) => o.value === props.value);
      const chosen = idx < 0 ? 0 : idx;
      return chosen === i ? 0 : -1;
    },
    onKey(event: KeyboardEvent) {
      const active: any = document.activeElement;
      const group = active ? active.closest('[role="radiogroup"]') : null;
      if (!group) return;
      const radios = Array.from(group.querySelectorAll('[role="radio"]:not([disabled])'));
      const i = radios.indexOf(active);
      let next = -1;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (i + 1) % radios.length;
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (i - 1 + radios.length) % radios.length;
      if (next >= 0) {
        event.preventDefault();
        const el = radios[next] as HTMLElement;
        el.focus();
        const v = el.getAttribute("data-value");
        if (v) state.select(v);
      }
    },
  });

  return (
    <div
      class={"cr-radiogroup" + (props.row ? " cr-radiogroup--row" : "")}
      role="radiogroup"
      aria-label={props.label}
      onKeyDown={(event) => state.onKey(event)}
    >
      <For each={props.options}>
        {(opt: CrRadioOption, i: number) => (
          <button
            type="button"
            role="radio"
            class="cr-radio"
            data-value={opt.value}
            aria-checked={props.value === opt.value ? "true" : "false"}
            disabled={opt.disabled}
            tabIndex={state.tabbable(i)}
            onClick={() => state.select(opt.value)}
          >
            <span class="cr-radio__box" aria-hidden="true"></span>
            {opt.label}
          </button>
        )}
      </For>
    </div>
  );
}
