import { Show, useRef, useStore, onUpdate } from "@builder.io/mitosis";

export interface CrModalProps {
  open?: boolean;
  title?: string;
  onClose?: () => void;
  children?: any;
  /* ── styling contract (portable pt/dt subset) ──
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

  const state = useStore({
    cls(base: string, part: string): string {
      const p = props.pt && props.pt[part];
      return ((props.unstyled ? "" : base) + (p && p.class ? " " + p.class : "")).trim();
    },
    pta(part: string): any {
      const p = props.pt && props.pt[part];
      if (!p) return {};
      const out: any = { ...p };
      delete out.class;
      delete out.style;
      return out;
    },
    partStyle(part: string): any {
      const p = props.pt && props.pt[part];
      const base = part === "root" ? props.dt || {} : {};
      return { ...base, ...(p && p.style ? p.style : {}) };
    },
  });

  onUpdate(() => {
    const node: any = dialogRef;
    if (!node || !node.showModal) return;
    if (props.open && !node.open) node.showModal();
    else if (!props.open && node.open) node.close();
  }, [props.open]);

  return (
    <dialog
      {...state.pta("root")}
      class={state.cls("cr-modal", "root")}
      data-part="root"
      style={state.partStyle("root")}
      ref={dialogRef}
      aria-label={props.title || "Dialog"}
      onClose={() => props.onClose && props.onClose()}
    >
      <div {...state.pta("head")} class={state.cls("cr-modal__head", "head")} data-part="head">
        <Show when={props.title}>
          <h2 {...state.pta("title")} class={state.cls("cr-modal__title", "title")} data-part="title">{props.title}</h2>
        </Show>
        <button
          {...state.pta("close")}
          type="button"
          data-part="close"
          class={state.cls("cr-modal__close", "close")}
          aria-label="Close"
          onClick={() => props.onClose && props.onClose()}
        >
          ✕
        </button>
      </div>
      <div {...state.pta("body")} class={state.cls("cr-modal__body", "body")} data-part="body">{props.children}</div>
    </dialog>
  );
}
