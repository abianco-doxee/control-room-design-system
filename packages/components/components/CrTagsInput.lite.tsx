import { useStore, For } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrTagsInputProps {
  /** Seed tags. */
  value?: string[];
  placeholder?: string;
  /** Accessible name for the group + entry field. */
  label?: string;
  /** Marks the control invalid for assistive tech (sets aria-invalid). Visual
   *  error styling comes from a wrapping CrField — this is the a11y half only. */
  invalid?: boolean;
  onChange?: (tags: string[]) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "list" · "tag" · "label" · "remove" · "input". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* TagsInput — enter a set of short tokens. Type and press Enter or "," to add a
 * tag; Backspace on an empty field removes the last; each tag has its own remove
 * button. It's a role=group with a label; the entry is a labelled text input and
 * every remove button names its tag ("Remove <tag>"). Duplicates are ignored.
 * Styling via .cr-tags. */
export default function CrTagsInput(props: CrTagsInputProps) {
  const state = useStore({
    tags: props.value ? [...props.value] : [],
    draft: "",
    commit(next: string[]) {
      state.tags = next;
      if (props.onChange) props.onChange(next);
    },
    updateDraft(value: string) {
      state.draft = value;
    },
    add() {
      const t = state.draft.trim();
      if (!t) return;
      if (state.tags.indexOf(t) === -1) state.commit(state.tags.concat([t]));
      state.draft = "";
    },
    removeAt(i: number) {
      const next = state.tags.slice();
      next.splice(i, 1);
      state.commit(next);
    },
    onKeyDown(event: any) {
      if (event.key === "Enter" || event.key === ",") {
        event.preventDefault();
        state.add();
      } else if (event.key === "Backspace" && state.draft === "" && state.tags.length > 0) {
        state.removeAt(state.tags.length - 1);
      }
    },
  });

  return (
    <div
      {...ptAttrs(props.pt, "root")}
      class={ptClass(props.pt, props.unstyled, "cr-tags", "root")}
      data-part="root"
      style={ptStyle(props.pt, props.dt, "root")}
      role="group"
      aria-label={props.label || "Tags"}
    >
      <ul {...ptAttrs(props.pt, "list")} class={ptClass(props.pt, props.unstyled, "cr-tags__list", "list")} data-part="list">
        <For each={state.tags}>
          {(tag: string, i: number) => (
            <li {...ptAttrs(props.pt, "tag")} class={ptClass(props.pt, props.unstyled, "cr-tags__tag", "tag")} data-part="tag">
              <span {...ptAttrs(props.pt, "label")} class={ptClass(props.pt, props.unstyled, "cr-tags__label", "label")} data-part="label">{tag}</span>
              <button {...ptAttrs(props.pt, "remove")} type="button" class={ptClass(props.pt, props.unstyled, "cr-tags__remove", "remove")} data-part="remove" aria-label={"Remove " + tag} onClick={() => state.removeAt(i)}>
                ✕
              </button>
            </li>
          )}
        </For>
      </ul>
      <input
        {...ptAttrs(props.pt, "input")}
        class={ptClass(props.pt, props.unstyled, "cr-tags__input", "input")}
        data-part="input"
        type="text"
        value={state.draft}
        placeholder={props.placeholder}
        aria-label={props.label || "Add tag"}
        aria-invalid={props.invalid ? "true" : "false"}
        data-state={props.invalid ? "invalid" : "valid"}
        onInput={(event) => state.updateDraft((event.target as HTMLInputElement).value)}
        onKeyDown={(event) => state.onKeyDown(event)}
        onBlur={() => state.add()}
      />
    </div>
  );
}
