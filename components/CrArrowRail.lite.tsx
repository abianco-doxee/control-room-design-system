import { For } from "@builder.io/mitosis";
export interface CrArrowRailProps { steps: string[]; activeIndex?: number; }
export default function CrArrowRail(props: CrArrowRailProps) {
  return (
    <div class="cr-rail">
      <For each={props.steps}>
        {(step: string, index: number) => (
          <span class={"cr-rail__step" + (index === props.activeIndex ? " cr-rail__step--on" : "")}>{step}</span>
        )}
      </For>
    </div>
  );
}
