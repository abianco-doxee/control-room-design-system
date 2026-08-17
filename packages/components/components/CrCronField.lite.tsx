import { Show, For, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrCronPreset {
  label: string;
  cron: string;
}

export interface CrCronFieldProps {
  /** Ties the label, input and messages together — required for a real field. */
  id: string;
  /** Visible label. Omit and the input still gets an accessible name. */
  label?: string;
  /** Submitted field name. */
  name?: string;
  value: string;
  /** Quick-fill presets. */
  presets?: CrCronPreset[];
  /** Human-readable translation of a VALID `value` — the host computes this (e.g.
   *  with cronstrue) and passes it in, so the design system stays parser-free. */
  description?: string;
  /** Static help text (shown when there's no description and no error). */
  hint?: string;
  /** Validation message for an unparseable / rejected expression. Its presence is
   *  the single source of truth: it sets aria-invalid, shows the error, and links
   *  it via aria-describedby. There is no hand-set `invalid` boolean — validity is
   *  a message from the host's parser/validator, not a guess. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "label" · "req" · "input" · "presets" · "preset" · "error" · "out" · "hint". */
  unstyled?: boolean;
  pt?: CrPassThrough<"error" | "hint" | "input" | "label" | "out" | "preset" | "presets" | "req" | "root">;
  dt?: CrDesignTokens;
}

/* Control Room cron Field — a proper form field: label + input + presets + a live
 * human-readable readout, wired for validation the same way as CrField. The host
 * translates the expression (cronstrue or any parser) and passes `description` when
 * it parses or `error` when it doesn't; the component only displays. `error` drives
 * aria-invalid + the error style; `description`/`hint` are linked via
 * aria-describedby. Controlled via value + onChange; onBlur lets a form validate on
 * leave. Styling via .cr-cron (+ the shared .cr-field__* label/hint/error). */
export default function CrCronField(props: CrCronFieldProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrCronField"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrCronField"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrCronField"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  return (
    <div
      {...ptAttrs(ptResolve(cr, props.pt, "CrCronField"), "root")}
      class={ptClass(ptResolve(cr, props.pt, "CrCronField"), props.unstyled, "cr-cron" + (props.error ? " cr-cron--error" : ""), "root")}
      data-part="root"
      data-state={props.error ? "error" : undefined}
      style={ptStyle(ptResolve(cr, props.pt, "CrCronField"), props.dt, "root")}
    >
      <Show when={props.label}>
        <label {...ptAttrs(ptResolve(cr, props.pt, "CrCronField"), "label")} class={ptClass(ptResolve(cr, props.pt, "CrCronField"), props.unstyled, "cr-field__label", "label")} data-part="label" for={props.id}>
          {props.label}
          <Show when={props.required}>
            <span {...ptAttrs(ptResolve(cr, props.pt, "CrCronField"), "req")} class={ptClass(ptResolve(cr, props.pt, "CrCronField"), props.unstyled, "cr-field__req", "req")} data-part="req" aria-hidden="true"> *</span>
          </Show>
        </label>
      </Show>
      <input
        {...ptAttrs(ptResolve(cr, props.pt, "CrCronField"), "input")}
        id={props.id}
        name={props.name}
        class={ptClass(ptResolve(cr, props.pt, "CrCronField"), props.unstyled, "cr-cron__input", "input")}
        data-part="input"
        data-state={props.error ? "error" : undefined}
        type="text"
        spellcheck={false}
        value={props.value}
        aria-label={props.label ? undefined : "Cron expression"}
        placeholder="* * * * *"
        disabled={props.disabled}
        required={props.required}
        aria-required={props.required ? "true" : undefined}
        aria-invalid={props.error ? "true" : "false"}
        aria-describedby={props.error ? props.id + "-err" : props.description ? props.id + "-desc" : props.hint ? props.id + "-hint" : undefined}
        onInput={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrCronField'), 'input', 'onInput', event); props.onChange && props.onChange((event.target as HTMLInputElement).value); }}
        onBlur={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrCronField'), 'input', 'onBlur', event); props.onBlur && props.onBlur(); }}
      />
      <Show when={props.presets}>
        <div {...ptAttrs(ptResolve(cr, props.pt, "CrCronField"), "presets")} class={ptClass(ptResolve(cr, props.pt, "CrCronField"), props.unstyled, "cr-cron__presets", "presets")} data-part="presets">
          <For each={props.presets}>
            {(pre: CrCronPreset) => (
              <button {...ptAttrs(ptResolve(cr, props.pt, "CrCronField"), "preset")} type="button" class={ptClass(ptResolve(cr, props.pt, "CrCronField"), props.unstyled, "cr-cron__preset", "preset")} data-part="preset" disabled={props.disabled} onClick={() => props.onChange && props.onChange(pre.cron)}>
                {pre.label}
              </button>
            )}
          </For>
        </div>
      </Show>
      <Show when={props.error}>
        <span {...ptAttrs(ptResolve(cr, props.pt, "CrCronField"), "error")} class={ptClass(ptResolve(cr, props.pt, "CrCronField"), props.unstyled, "cr-field__error", "error")} data-part="error" id={props.id + "-err"} role="alert">{props.error}</span>
      </Show>
      <Show when={props.description && !props.error}>
        <p {...ptAttrs(ptResolve(cr, props.pt, "CrCronField"), "out")} class={ptClass(ptResolve(cr, props.pt, "CrCronField"), props.unstyled, "cr-cron__out", "out")} data-part="out" id={props.id + "-desc"} aria-live="polite">{props.description}</p>
      </Show>
      <Show when={props.hint && !props.description && !props.error}>
        <span {...ptAttrs(ptResolve(cr, props.pt, "CrCronField"), "hint")} class={ptClass(ptResolve(cr, props.pt, "CrCronField"), props.unstyled, "cr-field__hint", "hint")} data-part="hint" id={props.id + "-hint"}>{props.hint}</span>
      </Show>
    </div>
  );
}
