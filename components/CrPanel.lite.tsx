import { Show } from "@builder.io/mitosis";
export interface CrPanelProps { title?: string; weight?: "default" | "major"; inset?: boolean; children?: any; }
export default function CrPanel(props: CrPanelProps) {
  return (
    <section class={"cr-panel" + (props.weight === "major" ? " cr-panel--major" : "") + (props.inset ? " cr-panel--inset" : "")}>
      <Show when={props.title}><h4 class="cr-panel__title">{props.title}</h4></Show>
      {props.children}
    </section>
  );
}
