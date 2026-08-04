import { Show, onMount, useStore } from "@builder.io/mitosis";

export interface CrToastProps {
  /** Machine signal the toast reports. `err` uses role=alert + assertive. */
  signal?: "work" | "wait" | "done" | "err";
  message?: string;
  /** Auto-dismiss after N ms. Omit to make it sticky. */
  duration?: number;
  onClose?: () => void;
  children?: any;
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
        class={"cr-toast" + (props.signal ? " cr-toast--" + props.signal : "")}
        role={props.signal === "err" ? "alert" : "status"}
        aria-live={props.signal === "err" ? "assertive" : "polite"}
      >
        <span class="cr-toast__msg">{props.message}{props.children}</span>
        <button type="button" class="cr-toast__close" aria-label="Dismiss" onClick={() => dismiss()}>
          ✕
        </button>
      </div>
    </Show>
  );
}
