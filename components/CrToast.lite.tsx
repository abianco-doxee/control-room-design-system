import { Show, onMount } from "@builder.io/mitosis";

export interface CrToastProps {
  /** Machine signal the toast reports. `err` uses role=alert + assertive. */
  signal?: "work" | "wait" | "done" | "err";
  message?: string;
  /** Auto-dismiss after N ms. Omit to make it sticky (needs a manual close). */
  duration?: number;
  onClose?: () => void;
  children?: any;
}

/** A transient status readout, keyed to a machine signal. Errors announce
 * assertively (role=alert); everything else is polite (role=status). Optional
 * auto-dismiss. See references/components.md#toast. */
export default function CrToast(props: CrToastProps) {
  onMount(() => {
    if (props.duration && props.onClose) {
      setTimeout(() => props.onClose && props.onClose(), props.duration);
    }
  });

  return (
    <div
      class={"cr-toast" + (props.signal ? " cr-toast--" + props.signal : "")}
      role={props.signal === "err" ? "alert" : "status"}
      aria-live={props.signal === "err" ? "assertive" : "polite"}
    >
      <span class="cr-toast__msg">{props.message}{props.children}</span>
      <Show when={props.onClose}>
        <button
          type="button"
          class="cr-toast__close"
          aria-label="Dismiss"
          onClick={() => props.onClose && props.onClose()}
        >
          ✕
        </button>
      </Show>
    </div>
  );
}
