import { Show } from "@builder.io/mitosis";
export interface CrHeroProps { big: string; sub?: string; state?: "accent" | "wait" | "err" | "calm"; children?: any; }
export default function CrHero(props: CrHeroProps) {
  return (
    <div class={"cr-hero" + (props.state && props.state !== "accent" ? " cr-hero--" + props.state : "")}>
      <div>
        <div class="cr-hero__big">{props.big}</div>
        <Show when={props.sub}><div class="cr-hero__sub">{props.sub}</div></Show>
      </div>
      {props.children}
    </div>
  );
}
