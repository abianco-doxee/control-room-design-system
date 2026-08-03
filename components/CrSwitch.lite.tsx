export interface CrSwitchProps {
  checked?: boolean;
  label?: string;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}

/** Control Room Switch — button[role=switch]; styling from .cr-switch. */
export default function CrSwitch(props: CrSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked ? "true" : "false"}
      disabled={props.disabled}
      class="cr-switch"
      onClick={() => props.onChange && props.onChange(!props.checked)}
    >
      <span class="cr-switch__track" aria-hidden="true" />
      {props.label}
    </button>
  );
}
