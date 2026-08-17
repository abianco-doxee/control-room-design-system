import { Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

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
  pt?: CrPassThrough<"badge" | "root">;
  dt?: CrDesignTokens;
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
    <button
      {...ptAttrs(ptResolve(cr, props.pt, "CrToggleChip"), "root")}
      type="button"
      role="checkbox"
      aria-checked={props.pressed ? "true" : "false"}
      disabled={props.disabled}
      data-part="root"
      data-state={props.pressed ? "on" : "off"}
      class={ptClass(ptResolve(cr, props.pt, "CrToggleChip"), props.unstyled, "cr-togglechip" + (props.pressed ? " cr-togglechip--on" : ""), "root")}
      style={ptStyle(ptResolve(cr, props.pt, "CrToggleChip"), props.dt, "root")}
      onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrToggleChip'), 'root', 'onClick', event); props.onToggle && props.onToggle(); }}
    >
      {props.label}
      <Show when={props.badge === true}>
        <span {...ptAttrs(ptResolve(cr, props.pt, "CrToggleChip"), "badge")} class={ptClass(ptResolve(cr, props.pt, "CrToggleChip"), props.unstyled, "cr-togglechip__badge cr-togglechip__badge--dot", "badge")} data-part="badge" aria-hidden="true" />
      </Show>
      <Show when={props.badge !== undefined && props.badge !== null && props.badge !== false && props.badge !== true}>
        <span {...ptAttrs(ptResolve(cr, props.pt, "CrToggleChip"), "badge")} class={ptClass(ptResolve(cr, props.pt, "CrToggleChip"), props.unstyled, "cr-togglechip__badge", "badge")} data-part="badge">
          {props.badge}
        </span>
      </Show>
    </button>
  );
}
