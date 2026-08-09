import { Show, useStore } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrAlertProps {
  /** Signal the alert carries: info (work) · wait · done · err. */
  signal?: "info" | "wait" | "done" | "err";
  title?: string;
  message?: string;
  /** Show a dismiss ✕. */
  dismissible?: boolean;
  onClose?: () => void;
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "icon" · "body" · "title" · "msg" · "close". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* Inline callout keyed to a signal (Law 2) — a left brush-bar in the signal hue.
 * `err` announces assertively (role=alert); the rest are polite (role=status).
 * Styling via .cr-alert. */
export default function CrAlert(props: CrAlertProps) {
  const state = useStore({
    open: true,
    dismiss() {
      state.open = false;
      if (props.onClose) props.onClose();
    },
  });

  return (
    <Show when={state.open}>
      <div
        {...ptAttrs(props.pt, "root")}
        class={ptClass(props.pt, props.unstyled, "cr-alert cr-alert--" + (props.signal || "info"), "root")}
        data-part="root"
        data-state={props.signal || "info"}
        style={ptStyle(props.pt, props.dt, "root")}
        role={props.signal === "err" ? "alert" : "status"}
        aria-live={props.signal === "err" ? "assertive" : "polite"}
      >
        <span {...ptAttrs(props.pt, "icon")} class={ptClass(props.pt, props.unstyled, "cr-alert__icon", "icon")} data-part="icon" aria-hidden="true"></span>
        <div {...ptAttrs(props.pt, "body")} class={ptClass(props.pt, props.unstyled, "cr-alert__body", "body")} data-part="body">
          <Show when={props.title}>
            <p {...ptAttrs(props.pt, "title")} class={ptClass(props.pt, props.unstyled, "cr-alert__title", "title")} data-part="title">{props.title}</p>
          </Show>
          <p {...ptAttrs(props.pt, "msg")} class={ptClass(props.pt, props.unstyled, "cr-alert__msg", "msg")} data-part="msg">
            {props.message}
            {props.children}
          </p>
        </div>
        <Show when={props.dismissible}>
          <button {...ptAttrs(props.pt, "close")} type="button" class={ptClass(props.pt, props.unstyled, "cr-alert__close", "close")} data-part="close" aria-label="Dismiss" onClick={() => state.dismiss()}>
            ✕
          </button>
        </Show>
      </div>
    </Show>
  );
}
