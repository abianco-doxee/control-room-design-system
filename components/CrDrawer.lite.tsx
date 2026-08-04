import { Show, useRef, onUpdate } from "@builder.io/mitosis";

export interface CrDrawerProps {
  open?: boolean;
  title?: string;
  /** Which edge it slides from. */
  side?: "left" | "right";
  onClose?: () => void;
  children?: any;
}

/* An edge sheet built on the native <dialog> — the browser owns focus-trap,
 * Esc-to-close, and the backdrop, so behaviour is identical in every target.
 * showModal()/close() are driven from props.open. Styling via .cr-drawer. */
export default function CrDrawer(props: CrDrawerProps) {
  const dialogRef = useRef(null);

  onUpdate(() => {
    const node: any = dialogRef;
    if (!node || !node.showModal) return;
    if (props.open && !node.open) node.showModal();
    else if (!props.open && node.open) node.close();
  }, [props.open]);

  return (
    <dialog
      class={"cr-drawer" + (props.side === "left" ? " cr-drawer--left" : "")}
      ref={dialogRef}
      aria-label={props.title || "Drawer"}
      onClose={() => props.onClose && props.onClose()}
    >
      <div class="cr-drawer__box">
        <div class="cr-drawer__head">
          <Show when={props.title}>
            <h2 class="cr-drawer__title">{props.title}</h2>
          </Show>
          <button type="button" class="cr-drawer__close" aria-label="Close" onClick={() => props.onClose && props.onClose()}>
            ✕
          </button>
        </div>
        <div class="cr-drawer__body">{props.children}</div>
      </div>
    </dialog>
  );
}
