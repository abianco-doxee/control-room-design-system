import { Show, onMount, useStore } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrToastProps {
  /** Machine signal the toast reports. `err` uses role=alert + assertive. */
  signal?: "work" | "wait" | "done" | "err";
  message?: string;
  /** Auto-dismiss after N ms. Omit to make it sticky. */
  duration?: number;
  onClose?: () => void;
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "msg" · "close". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/** A transient status readout, keyed to a machine signal. Errors announce
 * assertively (role=alert); everything else is polite (role=status). It is
 * always dismissable — the ✕ hides it locally and also calls onClose so a
 * sticky error is never un-clearable. See references/components.md#toast. */
export default function CrToast(props: CrToastProps) {
  const state = useStore({ open: true });

  function dismiss() {
    state.open = false;
    if (props.onClose) props.onClose();
  }

  onMount(() => {
    if (props.duration) setTimeout(() => dismiss(), props.duration);
  });

  return (
    <Show when={state.open}>
      <div
        {...ptAttrs(props.pt, "root")}
        data-part="root"
        data-state={props.signal}
        class={ptClass(props.pt, props.unstyled, "cr-toast" + (props.signal ? " cr-toast--" + props.signal : ""), "root")}
        role={props.signal === "err" ? "alert" : "status"}
        aria-live={props.signal === "err" ? "assertive" : "polite"}
        style={ptStyle(props.pt, props.dt, "root")}
      >
        <span {...ptAttrs(props.pt, "msg")} data-part="msg" class={ptClass(props.pt, props.unstyled, "cr-toast__msg", "msg")}>{props.message}{props.children}</span>
        <button {...ptAttrs(props.pt, "close")} type="button" data-part="close" class={ptClass(props.pt, props.unstyled, "cr-toast__close", "close")} aria-label="Dismiss" onClick={() => dismiss()}>
          ✕
        </button>
      </div>
    </Show>
  );
}
