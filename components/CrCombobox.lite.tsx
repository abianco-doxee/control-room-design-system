import { useStore, useRef, onMount, Show, For } from "@builder.io/mitosis";

export interface CrComboOption {
  value: string;
  label: string;
}

export interface CrComboboxProps {
  /** Static option list (filtered client-side). Omit when using `source`. */
  options?: CrComboOption[];
  /** Async data source: `(query) => Promise<CrComboOption[]>`. When set, it — not
   *  `options` — supplies (and filters) the results per keystroke. */
  source?: (query: string) => any;
  /** Selected value (controlled out; the field seeds its text from it). */
  value?: string;
  placeholder?: string;
  /** Accessible name for the field. */
  label?: string;
  onChange?: (value: string) => void;
}

/* Autocomplete: an input (role=combobox) over a listbox. Focus stays in the
 * field; ↑/↓ move the active option (aria-activedescendant), Enter selects, Esc
 * closes. A scrim closes it on outside click. The active row shows an ascii ▸.
 *
 * Two source modes: a static `options` list (filtered here as you type), or an
 * async `source(query)` for a remote lookup (the source does its own filtering;
 * it should also debounce / order its responses — the component renders whatever
 * resolves). Results are a useStore METHOD (a getter would run before the store
 * exists under Qwik). Styling via .cr-combobox. */
export default function CrCombobox(props: CrComboboxProps) {
  const inputRef = useRef(null);

  const state = useStore({
    query: "",
    open: false,
    active: 0,
    loading: false,
    loaded: [],
    results(): CrComboOption[] {
      if (props.source) return state.loaded;
      const q = state.query.trim().toLowerCase();
      const opts = props.options || [];
      if (!q) return opts;
      return opts.filter((o: CrComboOption) => o.label.toLowerCase().includes(q));
    },
    load(query: string) {
      if (!props.source) return;
      state.loading = true;
      Promise.resolve(props.source(query)).then(
        (res: any) => {
          state.loaded = res || [];
          state.loading = false;
          state.active = 0;
        },
        () => {
          state.loaded = [];
          state.loading = false;
        },
      );
    },
    onQuery(v: string) {
      state.query = v;
      state.open = true;
      state.active = 0;
      if (props.source) state.load(v);
    },
    openList() {
      state.open = true;
      if (props.source && state.loaded.length === 0) state.load(state.query || "");
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
    onKey(event: any) {
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
    const match = (props.options || []).find((o: CrComboOption) => o.value === props.value);
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
        onInput={(event) => state.onQuery((event.target as HTMLInputElement).value)}
        onFocus={() => state.openList()}
        onKeyDown={(event) => state.onKey(event)}
      />
      <Show when={state.open}>
        <button type="button" class="cr-combobox__scrim" aria-hidden="true" tabIndex={-1} onClick={() => state.close()}></button>
        <ul class="cr-combobox__list" id="cr-combobox-list" role="listbox">
          <Show when={state.loading}>
            <li class="cr-combobox__empty" aria-disabled="true">searching…</li>
          </Show>
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
          <Show when={!state.loading && state.results().length === 0}>
            <li class="cr-combobox__empty" aria-disabled="true">no matches</li>
          </Show>
        </ul>
      </Show>
    </div>
  );
}
