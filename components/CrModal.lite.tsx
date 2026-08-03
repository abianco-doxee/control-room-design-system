import { Show, useRef, onUpdate } from "@builder.io/mitosis";

export interface CrModalProps {
  open?: boolean;
  title?: string;
  onClose?: () => void;
  children?: any;
}

/** Accessible modal built on the native <dialog> element — the browser owns
 * focus-trap, Escape-to-close, and the backdrop, so behaviour is identical in
 * every target. showModal()/close() are driven imperatively from props.open.
 * See references/components.md#modal. */
export default function CrModal(props: CrModalProps) {
  const dialogRef = useRef(null);

  onUpdate(() => {
    const node: any = dialogRef;
    if (!node || !node.showModal) return;
    if (props.open && !node.open) node.showModal();
    else if (!props.open && node.open) node.close();
  }, [props.open]);

  return (
    <dialog
      class="cr-modal"
      ref={dialogRef}
      aria-label={props.title}
      onClose={() => props.onClose && props.onClose()}
    >
      <div class="cr-modal__head">
        <h2 class="cr-modal__title">{props.title}</h2>
        <button
          type="button"
          class="cr-modal__close"
          aria-label="Close"
          onClick={() => props.onClose && props.onClose()}
        >
          ✕
        </button>
      </div>
      <div class="cr-modal__body">{props.children}</div>
    </dialog>
  );
}
