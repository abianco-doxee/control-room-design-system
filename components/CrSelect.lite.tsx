import { For } from "@builder.io/mitosis";
// A bare native select. Pair with CrField for a *visible* label; standalone, pass
// `label` for an accessible name (maps to aria-label) so it is never unnamed.
export interface CrSelectProps { id?: string; options: string[]; label?: string; disabled?: boolean; }
export default function CrSelect(props: CrSelectProps) {
  return (
    <select id={props.id} class="cr-select" aria-label={props.label} disabled={props.disabled}>
      <For each={props.options}>{(opt: string) => <option value={opt}>{opt}</option>}</For>
    </select>
  );
}
