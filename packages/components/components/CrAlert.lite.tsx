import { Show, useStore, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, resolveMessage } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrAlertProps {
  /** Signal the alert carries (Law 2). Defaults to work. */
  signal?: "work" | "wait" | "done" | "err";
  title?: string;
  message?: string;
  /** Show a dismiss ✕. */
  dismissible?: boolean;
  onClose?: () => void;
  children?: any;
  /** Override this component's built-in English strings. Any key you omit falls
   *  back to the app-level `messages` from context, then to the built-in default.
   *  See lib/messages.ts for the keys. */
  labels?: Record<string, any>;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "icon" · "body" · "title" · "msg" · "close". */
  unstyled?: boolean;
  pt?: CrPassThrough<"body" | "close" | "icon" | "msg" | "root" | "title">;
  dt?: CrDesignTokens;
}

/* Inline callout keyed to a signal (Law 2) — a left brush-bar in the signal hue.
 * `err` announces assertively (role=alert); the rest are polite (role=status).
 * Styling via .cr-alert. */
export default function CrAlert(props: CrAlertProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onMounted) props.pt.hooks.onMounted();
  });
  onUpdate(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUpdated) props.pt.hooks.onUpdated();
  }, []);
  onUnMount(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUnmounted) props.pt.hooks.onUnmounted();
  });

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
        {...ptAttrs(ptResolve(cr, props.pt, "CrAlert"), "root")}
        class={ptClass(ptResolve(cr, props.pt, "CrAlert"), props.unstyled, "cr-alert cr-alert--" + (props.signal || "work"), "root")}
        data-part="root"
        data-state={props.signal || "work"}
        style={ptStyle(ptResolve(cr, props.pt, "CrAlert"), props.dt, "root")}
        role={props.signal === "err" ? "alert" : "status"}
        aria-live={props.signal === "err" ? "assertive" : "polite"}
      >
        <span {...ptAttrs(ptResolve(cr, props.pt, "CrAlert"), "icon")} class={ptClass(ptResolve(cr, props.pt, "CrAlert"), props.unstyled, "cr-alert__icon", "icon")} data-part="icon" aria-hidden="true"></span>
        <div {...ptAttrs(ptResolve(cr, props.pt, "CrAlert"), "body")} class={ptClass(ptResolve(cr, props.pt, "CrAlert"), props.unstyled, "cr-alert__body", "body")} data-part="body">
          <Show when={props.title}>
            <p {...ptAttrs(ptResolve(cr, props.pt, "CrAlert"), "title")} class={ptClass(ptResolve(cr, props.pt, "CrAlert"), props.unstyled, "cr-alert__title", "title")} data-part="title">{props.title}</p>
          </Show>
          <p {...ptAttrs(ptResolve(cr, props.pt, "CrAlert"), "msg")} class={ptClass(ptResolve(cr, props.pt, "CrAlert"), props.unstyled, "cr-alert__msg", "msg")} data-part="msg">
            {props.message}
            {props.children}
          </p>
        </div>
        <Show when={props.dismissible}>
          <button {...ptAttrs(ptResolve(cr, props.pt, "CrAlert"), "close")} type="button" class={ptClass(ptResolve(cr, props.pt, "CrAlert"), props.unstyled, "cr-alert__close", "close")} data-part="close" aria-label={resolveMessage(cr, props.labels, "CrAlert", "dismiss")} onClick={() => state.dismiss()}>
            ✕
          </button>
        </Show>
      </div>
    </Show>
  );
}
