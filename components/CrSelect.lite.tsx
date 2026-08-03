import { For } from "@builder.io/mitosis";
export interface CrSelectProps { id?: string; options: string[]; disabled?: boolean; }
export default function CrSelect(props: CrSelectProps) {
  return (
    <select id={props.id} class="cr-select" disabled={props.disabled}>
      <For each={props.options}>{(opt: string) => <option value={opt}>{opt}</option>}</For>
    </select>
  );
}
