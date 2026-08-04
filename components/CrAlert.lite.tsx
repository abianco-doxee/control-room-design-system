import { Show, useStore } from "@builder.io/mitosis";

export interface CrAlertProps {
  /** Signal the alert carries: info (work) · wait · done · err. */
  signal?: "info" | "wait" | "done" | "err";
  title?: string;
  message?: string;
  /** Show a dismiss ✕. */
  dismissible?: boolean;
  onClose?: () => void;
  children?: any;
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
        class={"cr-alert cr-alert--" + (props.signal || "info")}
        role={props.signal === "err" ? "alert" : "status"}
        aria-live={props.signal === "err" ? "assertive" : "polite"}
      >
        <span class="cr-alert__icon" aria-hidden="true"></span>
        <div class="cr-alert__body">
          <Show when={props.title}>
            <p class="cr-alert__title">{props.title}</p>
          </Show>
          <p class="cr-alert__msg">
            {props.message}
            {props.children}
          </p>
        </div>
        <Show when={props.dismissible}>
          <button type="button" class="cr-alert__close" aria-label="Dismiss" onClick={() => state.dismiss()}>
            ✕
          </button>
        </Show>
      </div>
    </Show>
  );
}
