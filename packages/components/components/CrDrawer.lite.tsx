import { Show, useRef, onUpdate, useContext, onMount, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler, resolveMessage } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrDrawerProps {
  open?: boolean;
  title?: string;
  /** Which edge it slides from. */
  side?: "left" | "right";
  onClose?: () => void;
  children?: any;
  /** Override this component's built-in English strings. Any key you omit falls
   *  back to the app-level `messages` from context, then to the built-in default.
   *  See lib/messages.ts for the keys. */
  labels?: Record<string, any>;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" (dialog) · "box" · "head" · "title" · "close" · "body". */
  unstyled?: boolean;
  pt?: CrPassThrough<"body" | "box" | "close" | "head" | "root" | "title">;
  dt?: CrDesignTokens;
}

/* An edge sheet built on the native <dialog> — the browser owns focus-trap,
 * Esc-to-close, and the backdrop, so behaviour is identical in every target.
 * showModal()/close() are driven from props.open. Styling via .cr-drawer. */
export default function CrDrawer(props: CrDrawerProps) {
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

  const dialogRef = useRef(null);

  onUpdate(() => {
    const node: any = dialogRef;
    if (!node || !node.showModal) return;
    if (props.open && !node.open) node.showModal();
    else if (!props.open && node.open) node.close();
  }, [props.open]);

  return (
    <dialog
      {...ptAttrs(ptResolve(cr, props.pt, "CrDrawer"), "root")}
      class={ptClass(ptResolve(cr, props.pt, "CrDrawer"), props.unstyled, "cr-drawer" + (props.side === "left" ? " cr-drawer--left" : ""), "root")}
      data-part="root"
      style={ptStyle(ptResolve(cr, props.pt, "CrDrawer"), props.dt, "root")}
      ref={dialogRef}
      aria-label={props.title || "Drawer"}
      onClose={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrDrawer'), 'root', 'onClose', event); props.onClose && props.onClose(); }}
    >
      <div {...ptAttrs(ptResolve(cr, props.pt, "CrDrawer"), "box")} class={ptClass(ptResolve(cr, props.pt, "CrDrawer"), props.unstyled, "cr-drawer__box", "box")} data-part="box">
        <div {...ptAttrs(ptResolve(cr, props.pt, "CrDrawer"), "head")} class={ptClass(ptResolve(cr, props.pt, "CrDrawer"), props.unstyled, "cr-drawer__head", "head")} data-part="head">
          <Show when={props.title}>
            <h2 {...ptAttrs(ptResolve(cr, props.pt, "CrDrawer"), "title")} class={ptClass(ptResolve(cr, props.pt, "CrDrawer"), props.unstyled, "cr-drawer__title", "title")} data-part="title">{props.title}</h2>
          </Show>
          <button {...ptAttrs(ptResolve(cr, props.pt, "CrDrawer"), "close")} type="button" class={ptClass(ptResolve(cr, props.pt, "CrDrawer"), props.unstyled, "cr-drawer__close", "close")} data-part="close" aria-label={resolveMessage(cr, props.labels, "CrDrawer", "close")} onClick={() => props.onClose && props.onClose()}>
            ✕
          </button>
        </div>
        <div {...ptAttrs(ptResolve(cr, props.pt, "CrDrawer"), "body")} class={ptClass(ptResolve(cr, props.pt, "CrDrawer"), props.unstyled, "cr-drawer__body", "body")} data-part="body">{props.children}</div>
      </div>
    </dialog>
  );
}
