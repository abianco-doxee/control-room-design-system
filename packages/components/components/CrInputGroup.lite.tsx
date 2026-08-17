import { Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrInputGroupProps {
  id?: string;
  /** Accessible name for the input. */
  label?: string;
  /** Leading addon (e.g. "https://", a currency, an icon glyph). Decorative. */
  prefix?: string;
  /** Trailing addon (e.g. a unit like "GB", "%"). Decorative. */
  suffix?: string;
  placeholder?: string;
  value?: string;
  /** Input type — text · email · url · number · search · tel. */
  type?: string;
  disabled?: boolean;
  /** Marks the control invalid for assistive tech (sets aria-invalid). Visual
   *  error styling comes from a wrapping CrField — this is the a11y half only. */
  invalid?: boolean;
  onInput?: (value: string) => void;
  /** Supply your own control instead of the built-in <input> — the prefix/suffix
   *  addons still flank it. You own the control's `id`, aria-label and validity
   *  state when you do. */
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "addon" · "input". */
  unstyled?: boolean;
  pt?: CrPassThrough<"addon" | "input" | "root">;
  dt?: CrDesignTokens;
}

/* InputGroup — an input flanked by prefix / suffix addons (protocol, currency,
 * unit…). The addons are decorative (aria-hidden) so they don't muddy the
 * accessible name; give the field a `label` (rendered as aria-label). For a
 * validated form field with its own label/hint/error use Field or Form instead.
 * Styling via .cr-input-group. */
export default function CrInputGroup(props: CrInputGroupProps) {
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

  return (
    <div
      {...ptAttrs(ptResolve(cr, props.pt, "CrInputGroup"), "root")}
      class={ptClass(ptResolve(cr, props.pt, "CrInputGroup"), props.unstyled, "cr-input-group", "root")}
      data-part="root"
      style={ptStyle(ptResolve(cr, props.pt, "CrInputGroup"), props.dt, "root")}
    >
      <Show when={props.prefix}>
        <span {...ptAttrs(ptResolve(cr, props.pt, "CrInputGroup"), "addon")} class={ptClass(ptResolve(cr, props.pt, "CrInputGroup"), props.unstyled, "cr-input-group__addon cr-input-group__addon--prefix", "addon")} data-part="addon" aria-hidden="true">{props.prefix}</span>
      </Show>
      <Show
        when={props.children}
        else={
          <input
            {...ptAttrs(ptResolve(cr, props.pt, "CrInputGroup"), "input")}
            id={props.id}
            class={ptClass(ptResolve(cr, props.pt, "CrInputGroup"), props.unstyled, "cr-input cr-input-group__input", "input")}
            data-part="input"
            type={props.type || "text"}
            value={props.value}
            placeholder={props.placeholder}
            disabled={props.disabled}
            aria-label={props.label}
            aria-invalid={props.invalid ? "true" : "false"}
            data-state={props.invalid ? "invalid" : "valid"}
            onInput={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrInputGroup'), 'input', 'onInput', event); props.onInput && props.onInput((event.target as HTMLInputElement).value); }}
          />
        }
      >
        {props.children}
      </Show>
      <Show when={props.suffix}>
        <span {...ptAttrs(ptResolve(cr, props.pt, "CrInputGroup"), "addon")} class={ptClass(ptResolve(cr, props.pt, "CrInputGroup"), props.unstyled, "cr-input-group__addon cr-input-group__addon--suffix", "addon")} data-part="addon" aria-hidden="true">{props.suffix}</span>
      </Show>
    </div>
  );
}
