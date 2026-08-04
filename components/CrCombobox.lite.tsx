import { useStore, useRef, onMount, Show, For } from "@builder.io/mitosis";

export interface CrComboOption {
  value: string;
  label: string;
}

export interface CrComboboxProps {
  options: CrComboOption[];
  /** Selected value (controlled out; the field seeds its text from it). */
  value?: string;
  placeholder?: string;
  /** Accessible name for the field. */
  label?: string;
  onChange?: (value: string) => void;
}

/* Autocomplete: an input (role=combobox) filtering a listbox. Focus stays in the
 * field; ↑/↓ move the active option (aria-activedescendant), Enter selects, Esc
 * closes. A scrim closes it on outside click. The active row shows an ascii ▸.
 * Filtered results are a useStore METHOD (a getter would run before the store
 * exists under Qwik). Styling via .cr-combobox. */
export default function CrCombobox(props: CrComboboxProps) {
  const inputRef = useRef(null);

  const state = useStore({
    query: "",
    open: false,
    active: 0,
    results(): CrComboOption[] {
      const q = state.query.trim().toLowerCase();
      if (!q) return props.options;
      return props.options.filter((o: CrComboOption) => o.label.toLowerCase().includes(q));
    },
    setQuery(v: string) {
      state.query = v;
      state.open = true;
      state.active = 0;
    },
    close() {
      state.open = false;
    },
    move(delta: number) {
      const n = state.results().length;
      if (n === 0) return;
      state.open = true;
      state.active = (state.active + delta + n) % n;
    },
    pick(opt: CrComboOption) {
      state.query = opt.label;
      state.open = false;
      if (props.onChange) props.onChange(opt.value);
    },
    onKey(event: KeyboardEvent) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        state.move(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        state.move(-1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        const r = state.results()[state.active];
        if (r) state.pick(r);
      } else if (event.key === "Escape") {
        state.open = false;
      }
    },
  });

  onMount(() => {
    const match = props.options.find((o: CrComboOption) => o.value === props.value);
    if (match) state.query = match.label;
  });

  return (
    <div class="cr-combobox">
      <input
        ref={inputRef}
        class="cr-combobox__input"
        type="text"
        role="combobox"
        aria-expanded={state.open ? "true" : "false"}
        aria-controls="cr-combobox-list"
        aria-activedescendant={state.open && state.results().length ? "cr-combo-" + state.active : undefined}
        aria-autocomplete="list"
        aria-label={props.label || props.placeholder || "Search"}
        placeholder={props.placeholder || "Search…"}
        value={state.query}
        onInput={(event) => state.setQuery((event.target as HTMLInputElement).value)}
        onFocus={() => (state.open = true)}
        onKeyDown={(event) => state.onKey(event)}
      />
      <Show when={state.open}>
        <button type="button" class="cr-combobox__scrim" aria-hidden="true" tabIndex={-1} onClick={() => state.close()}></button>
        <ul class="cr-combobox__list" id="cr-combobox-list" role="listbox">
          <For each={state.results()}>
            {(opt: CrComboOption, i: number) => (
              <li
                class={"cr-combobox__opt" + (i === state.active ? " cr-combobox__opt--active" : "")}
                id={"cr-combo-" + i}
                role="option"
                aria-selected={i === state.active ? "true" : "false"}
                onMouseEnter={() => (state.active = i)}
                onClick={() => state.pick(opt)}
              >
                {opt.label}
              </li>
            )}
          </For>
          <Show when={state.results().length === 0}>
            <li class="cr-combobox__empty" aria-disabled="true">no matches</li>
          </Show>
        </ul>
      </Show>
    </div>
  );
}
