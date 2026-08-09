import { Show, useRef, onUpdate } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrModalProps {
  open?: boolean;
  title?: string;
  onClose?: () => void;
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" (dialog) · "head" · "title" · "close" · "body". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/** Accessible modal built on the native <dialog> element — the browser owns
 * focus-trap, Escape-to-close, and the backdrop, so behaviour is identical in
 * every target. showModal()/close() are driven imperatively from props.open.
 * Styling: `.cr-modal` by default; `unstyled` drops it, `pt`/`dt` retarget it,
 * every part exposes data-part. See references/components.md#modal. */
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
      {...ptAttrs(props.pt, "root")}
      class={ptClass(props.pt, props.unstyled, "cr-modal", "root")}
      data-part="root"
      style={ptStyle(props.pt, props.dt, "root")}
      ref={dialogRef}
      aria-label={props.title || "Dialog"}
      onClose={() => props.onClose && props.onClose()}
    >
      <div {...ptAttrs(props.pt, "head")} class={ptClass(props.pt, props.unstyled, "cr-modal__head", "head")} data-part="head">
        <Show when={props.title}>
          <h2 {...ptAttrs(props.pt, "title")} class={ptClass(props.pt, props.unstyled, "cr-modal__title", "title")} data-part="title">{props.title}</h2>
        </Show>
        <button
          {...ptAttrs(props.pt, "close")}
          type="button"
          data-part="close"
          class={ptClass(props.pt, props.unstyled, "cr-modal__close", "close")}
          aria-label="Close"
          onClick={() => props.onClose && props.onClose()}
        >
          ✕
        </button>
      </div>
      <div {...ptAttrs(props.pt, "body")} class={ptClass(props.pt, props.unstyled, "cr-modal__body", "body")} data-part="body">{props.children}</div>
    </dialog>
  );
}
