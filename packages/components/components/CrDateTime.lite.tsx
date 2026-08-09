import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrDateTimeProps {
  value?: string;
  /** input type — datetime-local (default), date, or time. */
  kind?: "datetime-local" | "date" | "time";
  label?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* A styled native date/time input — the browser owns the picker, keyboard, and
 * locale. Styling via .cr-datetime. */
export default function CrDateTime(props: CrDateTimeProps) {
  return (
    <input
      {...ptAttrs(props.pt, "root")}
      type={props.kind || "datetime-local"}
      class={ptClass(props.pt, props.unstyled, "cr-datetime", "root")}
      data-part="root"
      style={ptStyle(props.pt, props.dt, "root")}
      value={props.value}
      min={props.min}
      max={props.max}
      disabled={props.disabled}
      aria-label={props.label || "date and time"}
      onInput={(event) => props.onChange && props.onChange((event.target as HTMLInputElement).value)}
    />
  );
}
