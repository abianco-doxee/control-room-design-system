import { Show, onMount, useStore, useContext, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, resolveMessage, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrToastProps {
  /** Machine signal the toast reports. `err` uses role=alert + assertive. */
  signal?: "work" | "wait" | "done" | "err";
  message?: string;
  /** Auto-dismiss after N ms. Omit to make it sticky. */
  duration?: number;
  onClose?: () => void;
  children?: any;
  /** Override this component's built-in English strings. Any key you omit falls
   *  back to the app-level `messages` from context, then to the built-in default.
   *  See lib/messages.ts for the keys. */
  labels?: Record<string, any>;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "msg" · "close". */
  unstyled?: boolean;
  pt?: CrPassThrough<"close" | "msg" | "root">;
  dt?: CrDesignTokens;
}

/** A transient status readout, keyed to a machine signal. Errors announce
 * assertively (role=alert); everything else is polite (role=status). It is
 * always dismissable — the ✕ hides it locally and also calls onClose so a
 * sticky error is never un-clearable. See references/components.md#toast. */
export default function CrToast(props: CrToastProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrToast"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrToast"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrToast"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

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
        {...ptAttrs(ptResolve(cr, props.pt, "CrToast"), "root")}
        data-part="root"
        data-state={props.signal}
        class={ptClass(ptResolve(cr, props.pt, "CrToast"), props.unstyled, "cr-toast" + (props.signal ? " cr-toast--" + props.signal : ""), "root")}
        role={props.signal === "err" ? "alert" : "status"}
        aria-live={props.signal === "err" ? "assertive" : "polite"}
        style={ptStyle(ptResolve(cr, props.pt, "CrToast"), props.dt, "root")}
      >
        <span {...ptAttrs(ptResolve(cr, props.pt, "CrToast"), "msg")} data-part="msg" class={ptClass(ptResolve(cr, props.pt, "CrToast"), props.unstyled, "cr-toast__msg", "msg")}>{props.message}{props.children}</span>
        <button {...ptAttrs(ptResolve(cr, props.pt, "CrToast"), "close")} type="button" data-part="close" class={ptClass(ptResolve(cr, props.pt, "CrToast"), props.unstyled, "cr-toast__close", "close")} aria-label={resolveMessage(cr, props.labels, "CrToast", "dismiss")} onClick={() => dismiss()}>
          ✕
        </button>
      </div>
    </Show>
  );
}
