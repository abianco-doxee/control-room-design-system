export interface CrChoiceProps { type?: "checkbox" | "radio"; name?: string; label: string; checked?: boolean; disabled?: boolean; onChange?: (checked: boolean) => void; }
export default function CrChoice(props: CrChoiceProps) {
  return (
    <label class="cr-check">
      <input
        type={props.type || "checkbox"}
        name={props.name}
        checked={props.checked}
        disabled={props.disabled}
        onChange={(event) => props.onChange && props.onChange(event.target.checked)}
      />
      <span>{props.label}</span>
    </label>
  );
}
