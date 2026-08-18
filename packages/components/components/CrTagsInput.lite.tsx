import { useStore, For, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptAttrs, ptClass, ptHandler, ptResolve, ptStyle, resolveMessage, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

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
  /** Override this component's built-in English strings. Any key you omit
   *  falls back to the app-level `messages` from context, then to the built-in
   *  default. See lib/messages.ts for the keys. */
  labels?: Record<string, any>;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "list" · "tag" · "label" · "remove" · "input". */
  unstyled?: boolean;
  pt?: CrPassThrough<"input" | "label" | "list" | "remove" | "root" | "tag">;
  dt?: CrDesignTokens;
}

/* TagsInput — enter a set of short tokens. Type and press Enter or "," to add a
 * tag; Backspace on an empty field removes the last; each tag has its own remove
 * button. It's a role=group with a label; the entry is a labelled text input and
 * every remove button names its tag ("Remove <tag>"). Duplicates are ignored.
 * Styling via .cr-tags. */
export default function CrTagsInput(props: CrTagsInputProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTagsInput"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTagsInput"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTagsInput"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

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
      {...ptAttrs(ptResolve(cr, props.pt, "CrTagsInput"), "root")}
      class={ptClass(ptResolve(cr, props.pt, "CrTagsInput"), props.unstyled, "cr-tags", "root")}
      data-part="root"
      style={ptStyle(ptResolve(cr, props.pt, "CrTagsInput"), props.dt, "root")}
      role="group"
      aria-label={props.label || "Tags"}
    >
      <ul {...ptAttrs(ptResolve(cr, props.pt, "CrTagsInput"), "list")} class={ptClass(ptResolve(cr, props.pt, "CrTagsInput"), props.unstyled, "cr-tags__list", "list")} data-part="list">
        <For each={state.tags}>
          {(tag: string, i: number) => (
            <li {...ptAttrs(ptResolve(cr, props.pt, "CrTagsInput"), "tag")} class={ptClass(ptResolve(cr, props.pt, "CrTagsInput"), props.unstyled, "cr-tags__tag", "tag")} data-part="tag">
              <span {...ptAttrs(ptResolve(cr, props.pt, "CrTagsInput"), "label")} class={ptClass(ptResolve(cr, props.pt, "CrTagsInput"), props.unstyled, "cr-tags__label", "label")} data-part="label">{tag}</span>
              <button {...ptAttrs(ptResolve(cr, props.pt, "CrTagsInput"), "remove")} type="button" class={ptClass(ptResolve(cr, props.pt, "CrTagsInput"), props.unstyled, "cr-tags__remove", "remove")} data-part="remove" aria-label={resolveMessage(cr, props.labels, "CrTagsInput", "removeTag", tag)} onClick={() => state.removeAt(i)}>
                ✕
              </button>
            </li>
          )}
        </For>
      </ul>
      <input
        {...ptAttrs(ptResolve(cr, props.pt, "CrTagsInput"), "input")}
        class={ptClass(ptResolve(cr, props.pt, "CrTagsInput"), props.unstyled, "cr-tags__input", "input")}
        data-part="input"
        type="text"
        value={state.draft}
        placeholder={props.placeholder}
        aria-label={props.label || "Add tag"}
        aria-invalid={props.invalid ? "true" : "false"}
        data-state={props.invalid ? "invalid" : "valid"}
        onInput={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrTagsInput'), 'input', 'onInput', event); state.updateDraft((event.target as HTMLInputElement).value); }}
        onKeyDown={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrTagsInput'), 'input', 'onKeyDown', event); state.onKeyDown(event); }}
        onBlur={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrTagsInput'), 'input', 'onBlur', event); state.add(); }}
      />
    </div>
  );
}
