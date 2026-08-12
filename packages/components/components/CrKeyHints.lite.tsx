import { useStore, onMount, onUnMount, For, Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";
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
  pt?: any;
  dt?: any;
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
 * carries aria-keyshortcuts plus an aria-label holding the spoken binding and
 * its description. The label sits per-binding, not on the list, so the bindings
 * stay separately navigable. Styling via .cr-keyhints. */
export default function CrKeyHints(props: CrKeyHintsProps) {
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
      return list.map((h: CrKeyHint) => ({
        keys: h.keys,
        label: h.label,
        steps: parseKeys(h.keys),
        spoken: describeKeys(h.keys),
      }));
    },
  });

  onMount(() => {
    window.addEventListener("keydown", state.onDown);
    window.addEventListener("keyup", state.onUp);
    window.addEventListener("blur", state.hide);
  });

  onUnMount(() => {
    window.removeEventListener("keydown", state.onDown);
    window.removeEventListener("keyup", state.onUp);
    window.removeEventListener("blur", state.hide);
  });

  return (
    <Show
      when={props.hints && props.hints.length > 0}
      else={
        /* invisible but in-layout, so Qwik's visible-task (which wires the listeners)
           actually runs — a display:none host would never become "visible". */
        <span
          {...ptAttrs(props.pt, "root")}
          class={ptClass(props.pt, props.unstyled, "cr-keyhints", "root")}
          data-part="root"
          aria-hidden="true"
          style={{ position: "fixed", left: "0", top: "0", width: "1px", height: "1px", opacity: "0", pointerEvents: "none" }}
        ></span>
      }
    >
      <ul
        {...ptAttrs(props.pt, "root")}
        class={ptClass(props.pt, props.unstyled, "cr-keyhints cr-keyhints--legend", "root")}
        data-part="root"
        aria-label={props.label || "Keyboard shortcuts"}
        style={ptStyle(props.pt, props.dt, "root")}
      >
        <For each={state.rows()}>
          {(row: { keys: string; label: string; steps: string[][]; spoken: string }) => (
            <li
              {...ptAttrs(props.pt, "item")}
              class={ptClass(props.pt, props.unstyled, "cr-keyhints__item", "item")}
              data-part="item"
              aria-keyshortcuts={row.keys}
              aria-label={row.spoken + ": " + row.label}
            >
              <span
                {...ptAttrs(props.pt, "keys")}
                class={ptClass(props.pt, props.unstyled, "cr-keyhints__keys", "keys")}
                data-part="keys"
                aria-hidden="true"
              >
                <For each={row.steps}>
                  {(step: string[], si: number) => (
                    <span
                      {...ptAttrs(props.pt, "chord")}
                      class={ptClass(props.pt, props.unstyled, "cr-keyhints__chord", "chord")}
                      data-part="chord"
                    >
                      <Show when={si > 0}>
                        <span
                          {...ptAttrs(props.pt, "then")}
                          class={ptClass(props.pt, props.unstyled, "cr-keyhints__then", "then")}
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
                                {...ptAttrs(props.pt, "plus")}
                                class={ptClass(props.pt, props.unstyled, "cr-keyhints__plus", "plus")}
                                data-part="plus"
                              >
                                +
                              </span>
                            </Show>
                            <CrKbd keys={k} />
                          </span>
                        )}
                      </For>
                    </span>
                  )}
                </For>
              </span>
              <span
                {...ptAttrs(props.pt, "label")}
                class={ptClass(props.pt, props.unstyled, "cr-keyhints__label", "label")}
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
