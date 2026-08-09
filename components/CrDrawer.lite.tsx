import { Show, useRef, onUpdate } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrDrawerProps {
  open?: boolean;
  title?: string;
  /** Which edge it slides from. */
  side?: "left" | "right";
  onClose?: () => void;
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" (dialog) · "box" · "head" · "title" · "close" · "body". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
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
      {...ptAttrs(props.pt, "root")}
      class={ptClass(props.pt, props.unstyled, "cr-drawer" + (props.side === "left" ? " cr-drawer--left" : ""), "root")}
      data-part="root"
      style={ptStyle(props.pt, props.dt, "root")}
      ref={dialogRef}
      aria-label={props.title || "Drawer"}
      onClose={() => props.onClose && props.onClose()}
    >
      <div {...ptAttrs(props.pt, "box")} class={ptClass(props.pt, props.unstyled, "cr-drawer__box", "box")} data-part="box">
        <div {...ptAttrs(props.pt, "head")} class={ptClass(props.pt, props.unstyled, "cr-drawer__head", "head")} data-part="head">
          <Show when={props.title}>
            <h2 {...ptAttrs(props.pt, "title")} class={ptClass(props.pt, props.unstyled, "cr-drawer__title", "title")} data-part="title">{props.title}</h2>
          </Show>
          <button {...ptAttrs(props.pt, "close")} type="button" class={ptClass(props.pt, props.unstyled, "cr-drawer__close", "close")} data-part="close" aria-label="Close" onClick={() => props.onClose && props.onClose()}>
            ✕
          </button>
        </div>
        <div {...ptAttrs(props.pt, "body")} class={ptClass(props.pt, props.unstyled, "cr-drawer__body", "body")} data-part="body">{props.children}</div>
      </div>
    </dialog>
  );
}
