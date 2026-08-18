import { useStore, useRef, onMount, Show, For, useContext, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

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
  /** Marks the control invalid for assistive tech (sets aria-invalid). Visual
   *  error styling comes from a wrapping CrField — this is the a11y half only. */
  invalid?: boolean;
  onChange?: (value: string) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "input" · "scrim" · "list" · "empty" · "option". */
  unstyled?: boolean;
  pt?: CrPassThrough<"empty" | "input" | "list" | "option" | "root" | "scrim">;
  dt?: CrDesignTokens;
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
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrCombobox"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrCombobox"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrCombobox"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

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
    /* param NOT named `query`: it collides with the store member of the same
     * name, and Mitosis's Vue generator rewrites store reads to `.value` — the
     * parameter becomes `function load(query.value)`, which is a syntax error.
     * Same trap as CrForm's `errs`; see the note there. */
    load(q: string) {
      if (!props.source) return;
      state.loading = true;
      Promise.resolve(props.source(q)).then(
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
    <div
      {...ptAttrs(ptResolve(cr, props.pt, "CrCombobox"), "root")}
      class={ptClass(ptResolve(cr, props.pt, "CrCombobox"), props.unstyled, "cr-combobox", "root")}
      data-part="root"
      data-state={state.open ? "open" : "closed"}
      style={ptStyle(ptResolve(cr, props.pt, "CrCombobox"), props.dt, "root")}
    >
      <input
        {...ptAttrs(ptResolve(cr, props.pt, "CrCombobox"), "input")}
        ref={inputRef}
        class={ptClass(ptResolve(cr, props.pt, "CrCombobox"), props.unstyled, "cr-combobox__input", "input")}
        data-part="input"
        data-state={state.open ? "open" : "closed"}
        type="text"
        role="combobox"
        aria-expanded={state.open ? "true" : "false"}
        aria-controls="cr-combobox-list"
        aria-activedescendant={state.open && state.results().length ? "cr-combo-" + state.active : undefined}
        aria-autocomplete="list"
        aria-label={props.label || props.placeholder || "Search"}
        aria-invalid={props.invalid ? "true" : "false"}
        placeholder={props.placeholder || "Search…"}
        value={state.query}
        onInput={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrCombobox'), 'input', 'onInput', event); state.onQuery((event.target as HTMLInputElement).value); }}
        onFocus={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrCombobox'), 'input', 'onFocus', event); state.openList(); }}
        onKeyDown={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrCombobox'), 'input', 'onKeyDown', event); state.onKey(event); }}
      />
      <Show when={state.open}>
        <button {...ptAttrs(ptResolve(cr, props.pt, "CrCombobox"), "scrim")} type="button" class={ptClass(ptResolve(cr, props.pt, "CrCombobox"), props.unstyled, "cr-combobox__scrim", "scrim")} data-part="scrim" aria-hidden="true" tabIndex={-1} onClick={() => state.close()}></button>
        <ul {...ptAttrs(ptResolve(cr, props.pt, "CrCombobox"), "list")} class={ptClass(ptResolve(cr, props.pt, "CrCombobox"), props.unstyled, "cr-combobox__list", "list")} data-part="list" id="cr-combobox-list" role="listbox">
          <Show when={state.loading}>
            <li {...ptAttrs(ptResolve(cr, props.pt, "CrCombobox"), "empty")} class={ptClass(ptResolve(cr, props.pt, "CrCombobox"), props.unstyled, "cr-combobox__empty", "empty")} data-part="empty" aria-disabled="true">searching…</li>
          </Show>
          <For each={state.results()}>
            {(opt: CrComboOption, i: number) => (
              <li
                {...ptAttrs(ptResolve(cr, props.pt, "CrCombobox"), "option")}
                class={ptClass(ptResolve(cr, props.pt, "CrCombobox"), props.unstyled, "cr-combobox__opt" + (i === state.active ? " cr-combobox__opt--active" : ""), "option")}
                data-part="option"
                data-state={i === state.active ? "active" : "inactive"}
                id={"cr-combo-" + i}
                role="option"
                aria-selected={i === state.active ? "true" : "false"}
                onMouseEnter={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrCombobox'), 'option', 'onMouseEnter', event); (state.active = i); }}
                onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrCombobox'), 'option', 'onClick', event); state.pick(opt); }}
              >
                {opt.label}
              </li>
            )}
          </For>
          <Show when={!state.loading && state.results().length === 0}>
            <li {...ptAttrs(ptResolve(cr, props.pt, "CrCombobox"), "empty")} class={ptClass(ptResolve(cr, props.pt, "CrCombobox"), props.unstyled, "cr-combobox__empty", "empty")} data-part="empty" aria-disabled="true">no matches</li>
          </Show>
        </ul>
      </Show>
    </div>
  );
}
