import { useStore, For, Show } from "@builder.io/mitosis";

export interface CrStepperStep {
  label: string;
  hint?: string;
}

export interface CrStepperProps {
  steps: CrStepperStep[];
  /** Zero-based index of the current step. */
  active?: number;
  /** When set, each step becomes a button that fires this with its index —
   *  turns the indicator into a navigable stepper. Omit for a read-only display. */
  onStep?: (index: number) => void;
}

/* Stepper — a numbered progress indicator for a multi-step flow (the shape the
 * forms guidance points to when a form is split into steps). Rendered as an
 * ordered list; the current step carries aria-current="step", done steps show a
 * check. Pass onStep to make steps navigable buttons (native focus/activation);
 * omit it for a read-only indicator. Styling via .cr-stepper. */
export default function CrStepper(props: CrStepperProps) {
  const state = useStore({
    cur(): number {
      return props.active || 0;
    },
    status(i: number): string {
      return i < state.cur() ? "done" : i === state.cur() ? "active" : "upcoming";
    },
    marker(i: number): string {
      return i < state.cur() ? "✓" : String(i + 1);
    },
  });

  return (
    <ol class="cr-stepper">
      <For each={props.steps}>
        {(step: CrStepperStep, i: number) => (
          <li class={"cr-stepper__item cr-stepper__item--" + state.status(i)} aria-current={i === state.cur() ? "step" : undefined}>
            <Show when={props.onStep}>
              <button type="button" class="cr-stepper__btn" onClick={() => props.onStep && props.onStep(i)}>
                <span class="cr-stepper__dot" aria-hidden="true">{state.marker(i)}</span>
                <span class="cr-stepper__text">
                  <span class="cr-stepper__label">{step.label}</span>
                  <Show when={step.hint}>
                    <span class="cr-stepper__hint">{step.hint}</span>
                  </Show>
                </span>
              </button>
            </Show>
            <Show when={!props.onStep}>
              <span class="cr-stepper__dot" aria-hidden="true">{state.marker(i)}</span>
              <span class="cr-stepper__text">
                <span class="cr-stepper__label">{step.label}</span>
                <Show when={step.hint}>
                  <span class="cr-stepper__hint">{step.hint}</span>
                </Show>
              </span>
            </Show>
          </li>
        )}
      </For>
    </ol>
  );
}
