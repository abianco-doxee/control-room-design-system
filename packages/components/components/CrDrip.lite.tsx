import { Show } from "@builder.io/mitosis";
export interface CrDripProps { title: string; sub?: string; }
export default function CrDrip(props: CrDripProps) {
  return (
    <div class="cr-drip">
      <div class="cr-drip__title">{props.title}</div>
      <Show when={props.sub}><div class="cr-drip__sub">{props.sub}</div></Show>
    </div>
  );
}
