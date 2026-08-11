import { Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

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
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "addon" · "input". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* InputGroup — an input flanked by prefix / suffix addons (protocol, currency,
 * unit…). The addons are decorative (aria-hidden) so they don't muddy the
 * accessible name; give the field a `label` (rendered as aria-label). For a
 * validated form field with its own label/hint/error use Field or Form instead.
 * Styling via .cr-input-group. */
export default function CrInputGroup(props: CrInputGroupProps) {
  return (
    <div
      {...ptAttrs(props.pt, "root")}
      class={ptClass(props.pt, props.unstyled, "cr-input-group", "root")}
      data-part="root"
      style={ptStyle(props.pt, props.dt, "root")}
    >
      <Show when={props.prefix}>
        <span {...ptAttrs(props.pt, "addon")} class={ptClass(props.pt, props.unstyled, "cr-input-group__addon cr-input-group__addon--prefix", "addon")} data-part="addon" aria-hidden="true">{props.prefix}</span>
      </Show>
      <input
        {...ptAttrs(props.pt, "input")}
        id={props.id}
        class={ptClass(props.pt, props.unstyled, "cr-input cr-input-group__input", "input")}
        data-part="input"
        type={props.type || "text"}
        value={props.value}
        placeholder={props.placeholder}
        disabled={props.disabled}
        aria-label={props.label}
        aria-invalid={props.invalid ? "true" : "false"}
        data-state={props.invalid ? "invalid" : "valid"}
        onInput={(event) => props.onInput && props.onInput((event.target as HTMLInputElement).value)}
      />
      <Show when={props.suffix}>
        <span {...ptAttrs(props.pt, "addon")} class={ptClass(props.pt, props.unstyled, "cr-input-group__addon cr-input-group__addon--suffix", "addon")} data-part="addon" aria-hidden="true">{props.suffix}</span>
      </Show>
    </div>
  );
}
