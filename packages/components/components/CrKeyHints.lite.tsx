import { useStore, onMount, onUnMount, For, Show, useContext, onUpdate } from "@builder.io/mitosis";
import { ptAttrs, ptClass, ptNested, ptResolve, ptStyle, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";
import { parseKeys, describeKeys } from "../lib/keys.ts";
import CrKbd from "./CrKbd.lite";

export interface CrKeyHint {
  /** `+` joins a chord (pressed together), a space joins a sequence (in order).
   *  e.g. "Ctrl+K" · "g p" · "Ctrl+K p". */
  keys: string;
  /** What the binding does, e.g. "Open the command palette". */
  label: string;
}

export interface CrKeyHintsProps {
  /** Bindings to render as a legend. Omit for the headless peek-only behavior. */
  hints?: CrKeyHint[];
  /** Hold this key to reveal every secondary key-hint at once. Default "Alt". */
  revealKey?: string;
  /** Accessible name for the legend list. Default "Keyboard shortcuts". */
  label?: string;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "item" · "keys" · "chord" · "plus" · "then" · "label". */
  unstyled?: boolean;
  /** `kbd` is a NESTED SECTION: its value is a `pt` for each inner CrKbd
   *  (`pt={{ kbd: { root: { class: "…" } } }}`), not an attribute bag. */
  pt?: CrPassThrough<
    "chord" | "item" | "kbd" | "keys" | "label" | "plus" | "root" | "then"
  >;
  dt?: CrDesignTokens;
}

/* Hold-to-reveal behavior plus an optional shortcut legend.
 * BEHAVIOR (always on): while the reveal key is held, sets data-cr-keys on the
 * document root so every hint keycap fades in. With no hints prop this is all it
 * does and it renders nothing visible — the original headless contract.
 * LEGEND (opt-in via hints): each binding is parsed with the notation readers
 * know from editors — plus joins a CHORD, a space joins a SEQUENCE. Chord
 * members are joined by a plus glyph, sequence steps by the word "then", so the
 * two read differently at a glance. See lib/keys.ts for the grammar.
 * ACCESSIBILITY: keycaps and both separators are decorative and aria-hidden, so
 * a screen reader never hears a row of unlabelled boxes. Each list item instead
 * carries an aria-label holding the spoken binding and its description. The
 * label sits per-binding, not on the list, so the bindings stay separately
 * navigable. Styling via .cr-keyhints.
 * ARIA GRAMMAR: aria-keyshortcuts is emitted ONLY for a single-step binding.
 * Its value is defined by WAI-ARIA as a space-separated list of ALTERNATIVE
 * combinations, each pressed simultaneously — so space means "or" there, while
 * in our syntax it means "then". Emitting a sequence raw would tell a
 * programmatic consumer that "g p" fires on g OR p, the opposite of the truth.
 * A conformant-but-absent attribute beats a present-and-wrong one, and the
 * aria-label already carries the sequence meaning for the user. The value is
 * the reparsed chord, not the author string, so forgiving input cannot leak
 * malformed ARIA. */
export default function CrKeyHints(props: CrKeyHintsProps) {
  const cr = useContext(CrContext);

  /* onMounted/onUnmounted are wired further down, merged with this component's own
   * window listeners — see the note there. Only onUpdated stands alone, because
   * CrKeyHints has no update work of its own to merge with. */
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrKeyHints"));
    if (h && h.onUpdated) h.onUpdated();
  });

  const state = useStore({
    reveal() {
      document.documentElement.setAttribute("data-cr-keys", "on");
    },
    hide() {
      document.documentElement.removeAttribute("data-cr-keys");
    },
    onDown(e: KeyboardEvent) {
      if (e.key === (props.revealKey || "Alt")) {
        e.preventDefault();
        state.reveal();
      }
    },
    onUp(e: KeyboardEvent) {
      if (e.key === (props.revealKey || "Alt")) state.hide();
    },
    /** [{ keys: raw, label, steps: string[][], spoken: string }] — parsed once per render. */
    rows() {
      const list = props.hints || [];
      return list.map((h: CrKeyHint) => {
        const steps = parseKeys(h.keys);
        return {
          keys: h.keys,
          label: h.label,
          steps: steps,
          spoken: describeKeys(h.keys),
          /* see the ARIA note above: only a single-step binding can be stated
             in aria-keyshortcuts without asserting the opposite of the truth. */
          shortcuts: steps.length === 1 ? steps[0].join("+") : undefined,
        };
      });
    },
  });

  /* The window listeners live in the SAME onMount/onUnMount as the pt lifecycle
   * hooks ON PURPOSE. Mitosis keeps only the LAST onMount/onUnMount per component
   * and silently drops the earlier ones, so a second pair here would discard
   * `pt.hooks.onMounted`/`onUnmounted` for this component alone — which is exactly
   * what happened before they were merged. CrKeyHints is the only component with
   * its own lifecycle work, so it is the only one affected. */
  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrKeyHints"));
    if (h && h.onMounted) h.onMounted();
    window.addEventListener("keydown", state.onDown);
    window.addEventListener("keyup", state.onUp);
    window.addEventListener("blur", state.hide);
  });

  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrKeyHints"));
    if (h && h.onUnmounted) h.onUnmounted();
    /* Guarded because Svelte runs onDestroy during SSR (unlike onMount, which it
     * skips), so this block executes on the server and `window` is not defined
     * there. The mount side needs no guard for the same reason. */
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", state.onDown);
      window.removeEventListener("keyup", state.onUp);
      window.removeEventListener("blur", state.hide);
    }
  });

  return (
    <Show
      when={props.hints && props.hints.length > 0}
      else={
        /* invisible but in-layout, so Qwik's visible-task (which wires the listeners)
           actually runs — a display:none host would never become "visible". */
        <span
          {...ptAttrs(ptResolve(cr, props.pt, "CrKeyHints"), "root")}
          class={ptClass(ptResolve(cr, props.pt, "CrKeyHints"), props.unstyled, "cr-keyhints", "root")}
          data-part="root"
          aria-hidden="true"
          style={{ position: "fixed", left: "0", top: "0", width: "1px", height: "1px", opacity: "0", pointerEvents: "none" }}
        ></span>
      }
    >
      <ul
        {...ptAttrs(ptResolve(cr, props.pt, "CrKeyHints"), "root")}
        class={ptClass(ptResolve(cr, props.pt, "CrKeyHints"), props.unstyled, "cr-keyhints cr-keyhints--legend", "root")}
        data-part="root"
        aria-label={props.label || "Keyboard shortcuts"}
        style={ptStyle(ptResolve(cr, props.pt, "CrKeyHints"), props.dt, "root")}
      >
        <For each={state.rows()}>
          {(row: { keys: string; label: string; steps: string[][]; spoken: string; shortcuts: string }) => (
            <li
              {...ptAttrs(ptResolve(cr, props.pt, "CrKeyHints"), "item")}
              class={ptClass(ptResolve(cr, props.pt, "CrKeyHints"), props.unstyled, "cr-keyhints__item", "item")}
              data-part="item"
              aria-keyshortcuts={row.shortcuts}
              aria-label={row.spoken + ": " + row.label}
            >
              <span
                {...ptAttrs(ptResolve(cr, props.pt, "CrKeyHints"), "keys")}
                class={ptClass(ptResolve(cr, props.pt, "CrKeyHints"), props.unstyled, "cr-keyhints__keys", "keys")}
                data-part="keys"
                aria-hidden="true"
              >
                <For each={row.steps}>
                  {(step: string[], si: number) => (
                    <span
                      {...ptAttrs(ptResolve(cr, props.pt, "CrKeyHints"), "chord")}
                      class={ptClass(ptResolve(cr, props.pt, "CrKeyHints"), props.unstyled, "cr-keyhints__chord", "chord")}
                      data-part="chord"
                    >
                      <Show when={si > 0}>
                        <span
                          {...ptAttrs(ptResolve(cr, props.pt, "CrKeyHints"), "then")}
                          class={ptClass(ptResolve(cr, props.pt, "CrKeyHints"), props.unstyled, "cr-keyhints__then", "then")}
                          data-part="then"
                        >
                          then
                        </span>
                      </Show>
                      <For each={step}>
                        {(k: string, ki: number) => (
                          <span class="cr-keyhints__member">
                            <Show when={ki > 0}>
                              <span
                                {...ptAttrs(ptResolve(cr, props.pt, "CrKeyHints"), "plus")}
                                class={ptClass(ptResolve(cr, props.pt, "CrKeyHints"), props.unstyled, "cr-keyhints__plus", "plus")}
                                data-part="plus"
                              >
                                +
                              </span>
                            </Show>
                            <CrKbd keys={k} pt={ptNested(ptResolve(cr, props.pt, "CrKeyHints"), "kbd")} />
                          </span>
                        )}
                      </For>
                    </span>
                  )}
                </For>
              </span>
              <span
                {...ptAttrs(ptResolve(cr, props.pt, "CrKeyHints"), "label")}
                class={ptClass(ptResolve(cr, props.pt, "CrKeyHints"), props.unstyled, "cr-keyhints__label", "label")}
                data-part="label"
                aria-hidden="true"
              >
                {row.label}
              </span>
            </li>
          )}
        </For>
      </ul>
    </Show>
  );
}
