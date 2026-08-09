import { useStore, useRef, For } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrPinInputProps {
  /** Number of digit cells. Default 6. */
  length?: number;
  /** Accessible name for the group. Default "Verification code". */
  label?: string;
  /** Fires on every change with the current (partial) code. */
  onChange?: (code: string) => void;
  /** Fires once every cell is filled. */
  onComplete?: (code: string) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "cell". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* PinInput — a one-time-code / PIN entry: N single-digit cells that behave as one
 * field. Typing advances focus, Backspace on an empty cell steps back, ←/→ move,
 * and a paste fills across cells. It's a role=group with a label; each cell is a
 * numeric input with its own "Digit N" label, and the first opts into
 * autocomplete="one-time-code" so platforms can offer the SMS code. State lives in
 * the DOM (read via a container ref), so it stays portable. Styling via .cr-pin. */
export default function CrPinInput(props: CrPinInputProps) {
  const rootRef = useRef(null);

  const state = useStore({
    slots(): number[] {
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
    <div {...ptAttrs(props.pt, "root")} data-part="root" class={ptClass(props.pt, props.unstyled, "cr-pin", "root")} style={ptStyle(props.pt, props.dt, "root")} role="group" aria-label={props.label || "Verification code"} ref={rootRef} onPaste={(event) => state.onPaste(event)}>
      <For each={state.slots()}>
        {(i: number) => (
          <input
            {...ptAttrs(props.pt, "cell")}
            data-part="cell"
            class={ptClass(props.pt, props.unstyled, "cr-pin__cell", "cell")}
            type="text"
            inputMode="numeric"
            autocomplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={"Digit " + (i + 1)}
            onInput={(event) => state.onInput(i, event)}
            onKeyDown={(event) => state.onKeyDown(i, event)}
          />
        )}
      </For>
    </div>
  );
}
