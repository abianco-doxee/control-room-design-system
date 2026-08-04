import { For } from "@builder.io/mitosis";

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
}

/* A fixed corner that stacks live toasts. The parent owns the list; each toast
 * is its own live region (role=alert for err, else status) so nothing double-
 * announces. Styling via .cr-toast-region / .cr-toast. */
export default function CrToastRegion(props: CrToastRegionProps) {
  return (
    <div class={"cr-toast-region cr-toast-region--" + (props.position || "tr")}>
      <For each={props.toasts}>
        {(t: CrToastItem) => (
          <div
            class={"cr-toast" + (t.signal ? " cr-toast--" + t.signal : "")}
            role={t.signal === "err" ? "alert" : "status"}
            aria-live={t.signal === "err" ? "assertive" : "polite"}
          >
            <span class="cr-toast__msg">{t.message}</span>
            <button
              type="button"
              class="cr-toast__close"
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
