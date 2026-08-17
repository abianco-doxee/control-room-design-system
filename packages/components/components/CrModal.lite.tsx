import { Show, useRef, onUpdate, useContext, onMount, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler, resolveMessage, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrModalProps {
  open?: boolean;
  title?: string;
  onClose?: () => void;
  children?: any;
  /** Override this component's built-in English strings. Any key you omit falls
   *  back to the app-level `messages` from context, then to the built-in default.
   *  See lib/messages.ts for the keys. */
  labels?: Record<string, any>;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" (dialog) · "head" · "title" · "close" · "body". */
  unstyled?: boolean;
  pt?: CrPassThrough<"body" | "close" | "head" | "root" | "title">;
  dt?: CrDesignTokens;
}

/** Accessible modal built on the native <dialog> element — the browser owns
 * focus-trap, Escape-to-close, and the backdrop, so behaviour is identical in
 * every target. showModal()/close() are driven imperatively from props.open.
 * Styling: `.cr-modal` by default; `unstyled` drops it, `pt`/`dt` retarget it,
 * every part exposes data-part. See references/components.md#modal. */
export default function CrModal(props: CrModalProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrModal"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrModal"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrModal"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  const dialogRef = useRef(null);

  onUpdate(() => {
    const node: any = dialogRef;
    if (!node || !node.showModal) return;
    if (props.open && !node.open) node.showModal();
    else if (!props.open && node.open) node.close();
  }, [props.open]);


  return (
    <dialog
      {...ptAttrs(ptResolve(cr, props.pt, "CrModal"), "root")}
      class={ptClass(ptResolve(cr, props.pt, "CrModal"), props.unstyled, "cr-modal", "root")}
      data-part="root"
      style={ptStyle(ptResolve(cr, props.pt, "CrModal"), props.dt, "root")}
      ref={dialogRef}
      aria-label={props.title || "Dialog"}
      onClose={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrModal'), 'root', 'onClose', event); props.onClose && props.onClose(); }}
    >
      <div {...ptAttrs(ptResolve(cr, props.pt, "CrModal"), "head")} class={ptClass(ptResolve(cr, props.pt, "CrModal"), props.unstyled, "cr-modal__head", "head")} data-part="head">
        <Show when={props.title}>
          <h2 {...ptAttrs(ptResolve(cr, props.pt, "CrModal"), "title")} class={ptClass(ptResolve(cr, props.pt, "CrModal"), props.unstyled, "cr-modal__title", "title")} data-part="title">{props.title}</h2>
        </Show>
        <button
          {...ptAttrs(ptResolve(cr, props.pt, "CrModal"), "close")}
          type="button"
          data-part="close"
          class={ptClass(ptResolve(cr, props.pt, "CrModal"), props.unstyled, "cr-modal__close", "close")}
          aria-label={resolveMessage(cr, props.labels, "CrModal", "close")}
          onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrModal'), 'close', 'onClick', event); props.onClose && props.onClose(); }}
        >
          ✕
        </button>
      </div>
      <div {...ptAttrs(ptResolve(cr, props.pt, "CrModal"), "body")} class={ptClass(ptResolve(cr, props.pt, "CrModal"), props.unstyled, "cr-modal__body", "body")} data-part="body">{props.children}</div>
    </dialog>
  );
}
