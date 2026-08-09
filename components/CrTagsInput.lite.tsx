import { useStore, For } from "@builder.io/mitosis";

export interface CrTagsInputProps {
  /** Seed tags. */
  value?: string[];
  placeholder?: string;
  /** Accessible name for the group + entry field. */
  label?: string;
  onChange?: (tags: string[]) => void;
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
    <div class="cr-tags" role="group" aria-label={props.label || "Tags"}>
      <ul class="cr-tags__list">
        <For each={state.tags}>
          {(tag: string, i: number) => (
            <li class="cr-tags__tag">
              <span class="cr-tags__label">{tag}</span>
              <button type="button" class="cr-tags__remove" aria-label={"Remove " + tag} onClick={() => state.removeAt(i)}>
                ✕
              </button>
            </li>
          )}
        </For>
      </ul>
      <input
        class="cr-tags__input"
        type="text"
        value={state.draft}
        placeholder={props.placeholder}
        aria-label={props.label || "Add tag"}
        onInput={(event) => state.updateDraft((event.target as HTMLInputElement).value)}
        onKeyDown={(event) => state.onKeyDown(event)}
        onBlur={() => state.add()}
      />
    </div>
  );
}
