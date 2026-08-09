import { For } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrToastItem {
  id: string | number;
  /** Machine signal; `err` announces assertively. */
  signal?: "work" | "wait" | "done" | "err";
  message: string;
}

export interface CrToastRegionProps {
  toasts: CrToastItem[];
  /** Screen corner: tr (default) · br · tl · bl. Bottom corners stack newest nearest the edge. */
  position?: "tr" | "br" | "tl" | "bl";
  onDismiss?: (id: string | number) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "toast" · "msg" · "close". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* A fixed corner that stacks live toasts. The parent owns the list; each toast
 * is its own live region (role=alert for err, else status) so nothing double-
 * announces. Styling via .cr-toast-region / .cr-toast. */
export default function CrToastRegion(props: CrToastRegionProps) {
  return (
    <div
      {...ptAttrs(props.pt, "root")}
      data-part="root"
      class={ptClass(props.pt, props.unstyled, "cr-toast-region cr-toast-region--" + (props.position || "tr"), "root")}
      style={ptStyle(props.pt, props.dt, "root")}
    >
      <For each={props.toasts}>
        {(t: CrToastItem) => (
          <div
            {...ptAttrs(props.pt, "toast")}
            data-part="toast"
            data-state={t.signal}
            class={ptClass(props.pt, props.unstyled, "cr-toast" + (t.signal ? " cr-toast--" + t.signal : ""), "toast")}
            role={t.signal === "err" ? "alert" : "status"}
            aria-live={t.signal === "err" ? "assertive" : "polite"}
          >
            <span {...ptAttrs(props.pt, "msg")} data-part="msg" class={ptClass(props.pt, props.unstyled, "cr-toast__msg", "msg")}>{t.message}</span>
            <button
              {...ptAttrs(props.pt, "close")}
              type="button"
              data-part="close"
              class={ptClass(props.pt, props.unstyled, "cr-toast__close", "close")}
              aria-label="Dismiss"
              onClick={() => props.onDismiss && props.onDismiss(t.id)}
            >
              ✕
            </button>
          </div>
        )}
      </For>
    </div>
  );
}
