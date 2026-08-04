import { useStore, useRef, onUpdate, Show, For } from "@builder.io/mitosis";

export interface CrCommand {
  id: string;
  label: string;
  /** Optional keycap hint shown on the row. */
  hint?: string;
  /** Optional group label (right-aligned). */
  group?: string;
}

export interface CrPaletteProps {
  /** Controlled visibility — open with ⌘K/Ctrl+K from the host. */
  open?: boolean;
  commands: CrCommand[];
  placeholder?: string;
  /** Fires with the chosen command id. */
  onRun?: (id: string) => void;
  onClose?: () => void;
}

/* Command palette on the native <dialog> (browser focus-trap + Esc + backdrop).
 * The input is a combobox driving a listbox: focus stays in the field while ↑/↓
 * move the active option (aria-activedescendant), Enter runs it. Derived results
 * live in a useStore getter. Styling via .cr-palette. */
export default function CrPalette(props: CrPaletteProps) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);

  const state = useStore({
    query: "",
    active: 0,
    /* a method, not a getter — a getter compiles to a Qwik useComputed that runs
       eagerly before `state` is initialized (TDZ crash). */
    results(): CrCommand[] {
      const q = state.query.trim().toLowerCase();
      if (!q) return props.commands;
      return props.commands.filter(
        (c: CrCommand) =>
          c.label.toLowerCase().includes(q) || (c.group || "").toLowerCase().includes(q),
      );
    },
    setQuery(v: string) {
      state.query = v;
      state.active = 0;
    },
    move(delta: number) {
      const n = state.results().length;
      if (n === 0) return;
      state.active = (state.active + delta + n) % n;
    },
    run(id: string) {
      if (props.onRun) props.onRun(id);
    },
    onKey(event: KeyboardEvent) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        state.move(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        state.move(-1);
      } else if (event.key === "Home") {
        event.preventDefault();
        state.active = 0;
      } else if (event.key === "End") {
        event.preventDefault();
        state.active = state.results().length - 1;
      } else if (event.key === "Enter") {
        event.preventDefault();
        const r = state.results()[state.active];
        if (r) state.run(r.id);
      }
      /* Escape is handled by the native dialog (onClose → props.onClose) */
    },
  });

  onUpdate(() => {
    const node: any = dialogRef;
    if (!node || !node.showModal) return;
    if (props.open && !node.open) {
      state.query = "";
      state.active = 0;
      node.showModal();
      const inp: any = inputRef;
      if (inp) setTimeout(() => inp.focus(), 0);
    } else if (!props.open && node.open) {
      node.close();
    }
  }, [props.open]);

  return (
    <dialog
      class="cr-palette"
      ref={dialogRef}
      aria-label="Command palette"
      onClose={() => props.onClose && props.onClose()}
    >
      <div class="cr-palette__box">
        <input
          ref={inputRef}
          class="cr-palette__input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="cr-palette-list"
          aria-activedescendant={state.results().length ? "cr-cmd-" + state.active : undefined}
          aria-autocomplete="list"
          aria-label="Search commands"
          placeholder={props.placeholder || "Type a command…"}
          value={state.query}
          onInput={(event) => state.setQuery((event.target as HTMLInputElement).value)}
          onKeyDown={(event) => state.onKey(event)}
        />
        <ul class="cr-palette__list" id="cr-palette-list" role="listbox" aria-label="Commands">
          <For each={state.results()}>
            {(cmd: CrCommand, i: number) => (
              <li
                class={"cr-palette__item" + (i === state.active ? " cr-palette__item--active" : "")}
                id={"cr-cmd-" + i}
                role="option"
                aria-selected={i === state.active ? "true" : "false"}
                onClick={() => state.run(cmd.id)}
                onMouseEnter={() => (state.active = i)}
              >
                <span class="cr-palette__label">{cmd.label}</span>
                <Show when={cmd.group}>
                  <span class="cr-palette__group">{cmd.group}</span>
                </Show>
                <Show when={cmd.hint}>
                  <kbd class="cr-kbd" aria-hidden="true">{cmd.hint}</kbd>
                </Show>
              </li>
            )}
          </For>
          <Show when={state.results().length === 0}>
            <li class="cr-palette__empty" aria-disabled="true">no matches</li>
          </Show>
        </ul>
      </div>
    </dialog>
  );
}
