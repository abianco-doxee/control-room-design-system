import { useStore, useRef, For, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptAttrs, ptClass, ptHandler, ptResolve, ptStyle, resolveMessage, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrPinInputProps {
  /** Number of digit cells. Default 6. */
  length?: number;
  /** Accessible name for the group. Default "Verification code". */
  label?: string;
  /** Fires on every change with the current (partial) code. */
  onChange?: (code: string) => void;
  /** Fires once every cell is filled. */
  onComplete?: (code: string) => void;
  /** Marks every cell invalid for assistive tech (sets aria-invalid). Visual
   *  error styling comes from a wrapping CrField — this is the a11y half only. */
  invalid?: boolean;
  /** Override this component's built-in English strings. Any key you omit
   *  falls back to the app-level `messages` from context, then to the built-in
   *  default. See lib/messages.ts for the keys. */
  labels?: Record<string, any>;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "cell". */
  unstyled?: boolean;
  pt?: CrPassThrough<"cell" | "root">;
  dt?: CrDesignTokens;
}

/* PinInput — a one-time-code / PIN entry: N single-digit cells that behave as one
 * field. Typing advances focus, Backspace on an empty cell steps back, ←/→ move,
 * and a paste fills across cells. It's a role=group with a label; each cell is a
 * numeric input with its own "Digit N" label, and the first opts into
 * autocomplete="one-time-code" so platforms can offer the SMS code. State lives in
 * the DOM (read via a container ref), so it stays portable. Styling via .cr-pin. */
export default function CrPinInput(props: CrPinInputProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrPinInput"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrPinInput"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrPinInput"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  const rootRef = useRef(null);

  const state = useStore({
    /* NOT named `slots`: Svelte reserves `$$slots`, and Mitosis rewrites a store
     * member called `slots` into `$$slots.s()` — which is not a function, so the
     * component throws on render. */
    cells(): number[] {
      const n = props.length || 6;
      const out: number[] = [];
      for (let i = 0; i < n; i++) out.push(i);
      return out;
    },
    inputs(): any[] {
      const root: any = rootRef;
      return root ? Array.from(root.querySelectorAll("input")) : [];
    },
    focusAt(i: number) {
      const ins = state.inputs();
      if (i >= 0 && i < ins.length) (ins[i] as HTMLInputElement).focus();
    },
    emit() {
      const code = state.inputs().map((el: any) => el.value || "").join("");
      if (props.onChange) props.onChange(code);
      if (code.length === (props.length || 6) && props.onComplete) props.onComplete(code);
    },
    onInput(i: number, event: any) {
      const el = event.target;
      const digits = (el.value || "").replace(/[^0-9]/g, "");
      el.value = digits.slice(-1); /* one digit per cell */
      if (el.value) state.focusAt(i + 1);
      state.emit();
    },
    onKeyDown(i: number, event: any) {
      if (event.key === "Backspace" && !event.target.value) {
        state.focusAt(i - 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        state.focusAt(i - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        state.focusAt(i + 1);
      }
    },
    onPaste(event: any) {
      const raw = event.clipboardData ? event.clipboardData.getData("text") : "";
      const digits = (raw || "").replace(/[^0-9]/g, "");
      if (!digits) return;
      event.preventDefault();
      const ins = state.inputs();
      for (let k = 0; k < ins.length; k++) (ins[k] as HTMLInputElement).value = digits[k] || "";
      const filled = Math.min(digits.length, ins.length);
      state.focusAt(filled >= ins.length ? ins.length - 1 : filled);
      state.emit();
    },
  });

  return (
    <div {...ptAttrs(ptResolve(cr, props.pt, "CrPinInput"), "root")} data-part="root" class={ptClass(ptResolve(cr, props.pt, "CrPinInput"), props.unstyled, "cr-pin", "root")} style={ptStyle(ptResolve(cr, props.pt, "CrPinInput"), props.dt, "root")} role="group" aria-label={props.label || "Verification code"} ref={rootRef} onPaste={(event) => state.onPaste(event)}>
      <For each={state.cells()}>
        {(i: number) => (
          <input
            {...ptAttrs(ptResolve(cr, props.pt, "CrPinInput"), "cell")}
            data-part="cell"
            class={ptClass(ptResolve(cr, props.pt, "CrPinInput"), props.unstyled, "cr-pin__cell", "cell")}
            type="text"
            inputMode="numeric"
            autocomplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={resolveMessage(cr, props.labels, "CrPinInput", "digit", i + 1)}
            aria-invalid={props.invalid ? "true" : "false"}
            data-state={props.invalid ? "invalid" : "valid"}
            onInput={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrPinInput'), 'cell', 'onInput', event); state.onInput(i, event); }}
            onKeyDown={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrPinInput'), 'cell', 'onKeyDown', event); state.onKeyDown(i, event); }}
          />
        )}
      </For>
    </div>
  );
}
