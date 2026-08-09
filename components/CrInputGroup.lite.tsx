import { Show } from "@builder.io/mitosis";

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
  onInput?: (value: string) => void;
}

/* InputGroup — an input flanked by prefix / suffix addons (protocol, currency,
 * unit…). The addons are decorative (aria-hidden) so they don't muddy the
 * accessible name; give the field a `label` (rendered as aria-label). For a
 * validated form field with its own label/hint/error use Field or Form instead.
 * Styling via .cr-input-group. */
export default function CrInputGroup(props: CrInputGroupProps) {
  return (
    <div class="cr-input-group">
      <Show when={props.prefix}>
        <span class="cr-input-group__addon cr-input-group__addon--prefix" aria-hidden="true">{props.prefix}</span>
      </Show>
      <input
        id={props.id}
        class="cr-input cr-input-group__input"
        type={props.type || "text"}
        value={props.value}
        placeholder={props.placeholder}
        disabled={props.disabled}
        aria-label={props.label}
        onInput={(event) => props.onInput && props.onInput((event.target as HTMLInputElement).value)}
      />
      <Show when={props.suffix}>
        <span class="cr-input-group__addon cr-input-group__addon--suffix" aria-hidden="true">{props.suffix}</span>
      </Show>
    </div>
  );
}
