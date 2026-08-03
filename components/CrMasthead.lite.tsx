import { Show } from "@builder.io/mitosis";
export interface CrMastheadProps { eyebrow?: string; title: string; children?: any; }
export default function CrMasthead(props: CrMastheadProps) {
  return (
    <header class="cr-masthead">
      <Show when={props.eyebrow}><p class="cr-masthead__eyebrow">{props.eyebrow}</p></Show>
      <h1 class="cr-masthead__title">{props.title}</h1>
      {props.children}
    </header>
  );
}
