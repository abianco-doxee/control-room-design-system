import { Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrToggleChipProps {
  label: string;
  /** On/off state (multi-select filter semantics — use several independently). */
  pressed?: boolean;
  /** Trailing badge — a number or short string renders as a pill; `true`
   *  renders a bare dot for "has matches" with no count. */
  badge?: string | number | boolean;
  onToggle?: () => void;
  disabled?: boolean;
  /* ── styling contract (portable pt/dt subset). Parts: "root" · "badge".
   * Law 2: the ON state reads via the accent (a state), NOT a per-option identity
   * hue — retarget it with dt={{ "--cr-togglechip-on-bg": … }} if needed. */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* An interactive multi-select filter pill (role=checkbox). Distinct from the
 * static CrChip (display) and the single-select CrSegmented (radiogroup): several
 * ToggleChips toggle independently. On/off is announced via aria-checked and
 * exposed as data-state. Styling: .cr-togglechip; data-part on root + badge.
 *
 * `badge` is deliberately three-valued: `false`/`undefined` render nothing,
 * `true` renders a bare dot ("there are matches, count unknown/irrelevant"), and
 * any string or number renders verbatim — so 0 and "" still render, because an
 * explicit zero is a meaningful filter result. */
export default function CrToggleChip(props: CrToggleChipProps) {
  return (
    <button
      {...ptAttrs(props.pt, "root")}
      type="button"
      role="checkbox"
      aria-checked={props.pressed ? "true" : "false"}
      disabled={props.disabled}
      data-part="root"
      data-state={props.pressed ? "on" : "off"}
      class={ptClass(props.pt, props.unstyled, "cr-togglechip" + (props.pressed ? " cr-togglechip--on" : ""), "root")}
      style={ptStyle(props.pt, props.dt, "root")}
      onClick={() => props.onToggle && props.onToggle()}
    >
      {props.label}
      <Show when={props.badge === true}>
        <span {...ptAttrs(props.pt, "badge")} class={ptClass(props.pt, props.unstyled, "cr-togglechip__badge cr-togglechip__badge--dot", "badge")} data-part="badge" aria-hidden="true" />
      </Show>
      <Show when={props.badge !== undefined && props.badge !== null && props.badge !== false && props.badge !== true}>
        <span {...ptAttrs(props.pt, "badge")} class={ptClass(props.pt, props.unstyled, "cr-togglechip__badge", "badge")} data-part="badge">
          {props.badge}
        </span>
      </Show>
    </button>
  );
}
