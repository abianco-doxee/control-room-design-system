import { useStore, For, Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrFileUploadProps {
  label: string;
  /** `accept` attribute forwarded to the native input (e.g. ".csv,image/*"). */
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /** Secondary hint line under the prompt (e.g. "CSV up to 10 MB"). */
  hint?: string;
  /** Selected files to display (consumer maps a FileList → names). Display only. */
  files?: string[];
  /** Fires with the native FileList on pick or drop. */
  onFiles?: (files: any) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "input" · "prompt" · "list" · "file". State: idle · dragover.
   * The dragover accent is `--cr-fileupload-active-border` (a state, Law 2). */
  unstyled?: boolean;
  pt?: CrPassThrough<"file" | "input" | "list" | "prompt" | "root">;
  dt?: CrDesignTokens;
}

/* A file dropzone with a real native <input type=file> underneath — click or
 * keyboard opens the picker, drag-and-drop is also accepted, and the dragover
 * state is announced via data-state. The input stays a focusable, labelled control
 * (visually hidden, not display:none) so keyboard and screen-reader users get the
 * native experience; the styled surface is aria-hidden decoration. Styling via
 * .cr-fileupload; data-part per part. */
export default function CrFileUpload(props: CrFileUploadProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrFileUpload"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrFileUpload"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrFileUpload"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  const state = useStore({
    over: false,
    onChange(event: any) {
      if (props.onFiles && event.target && event.target.files) props.onFiles(event.target.files);
    },
    onDragOver(event: any) {
      if (props.disabled) return;
      event.preventDefault();
      state.over = true;
    },
    onDragLeave() {
      state.over = false;
    },
    onDrop(event: any) {
      if (props.disabled) return;
      event.preventDefault();
      state.over = false;
      if (props.onFiles && event.dataTransfer && event.dataTransfer.files) props.onFiles(event.dataTransfer.files);
    },
  });

  return (
    <label
      {...ptAttrs(ptResolve(cr, props.pt, "CrFileUpload"), "root")}
      data-part="root"
      data-state={state.over ? "dragover" : "idle"}
      class={ptClass(ptResolve(cr, props.pt, "CrFileUpload"), props.unstyled, "cr-fileupload" + (state.over ? " cr-fileupload--over" : ""), "root")}
      style={ptStyle(ptResolve(cr, props.pt, "CrFileUpload"), props.dt, "root")}
      onDragOver={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrFileUpload'), 'root', 'onDragOver', event); state.onDragOver(event); }}
      onDragLeave={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrFileUpload'), 'root', 'onDragLeave', event); state.onDragLeave(); }}
      onDrop={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrFileUpload'), 'root', 'onDrop', event); state.onDrop(event); }}
    >
      <input
        {...ptAttrs(ptResolve(cr, props.pt, "CrFileUpload"), "input")}
        data-part="input"
        class={ptClass(ptResolve(cr, props.pt, "CrFileUpload"), props.unstyled, "cr-fileupload__input", "input")}
        type="file"
        aria-label={props.label}
        accept={props.accept}
        multiple={props.multiple}
        disabled={props.disabled}
        onChange={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrFileUpload'), 'input', 'onChange', event); state.onChange(event); }}
      />
      <span {...ptAttrs(ptResolve(cr, props.pt, "CrFileUpload"), "prompt")} data-part="prompt" class={ptClass(ptResolve(cr, props.pt, "CrFileUpload"), props.unstyled, "cr-fileupload__prompt", "prompt")} aria-hidden="true">
        <span class="cr-fileupload__title">{props.label}</span>
        <Show when={props.hint}>
          <span class="cr-fileupload__hint">{props.hint}</span>
        </Show>
      </span>
      <Show when={props.files && props.files.length > 0}>
        <ul {...ptAttrs(ptResolve(cr, props.pt, "CrFileUpload"), "list")} data-part="list" class={ptClass(ptResolve(cr, props.pt, "CrFileUpload"), props.unstyled, "cr-fileupload__list", "list")}>
          <For each={props.files}>
            {(name: string) => (
              <li {...ptAttrs(ptResolve(cr, props.pt, "CrFileUpload"), "file")} data-part="file" class={ptClass(ptResolve(cr, props.pt, "CrFileUpload"), props.unstyled, "cr-fileupload__file", "file")}>
                {name}
              </li>
            )}
          </For>
        </ul>
      </Show>
    </label>
  );
}
