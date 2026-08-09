import { useStore, For, Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

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
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "item" · "btn" · "dot" · "text" · "label" · "hint". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
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
    <ol {...ptAttrs(props.pt, "root")} data-part="root" class={ptClass(props.pt, props.unstyled, "cr-stepper", "root")} style={ptStyle(props.pt, props.dt, "root")}>
      <For each={props.steps}>
        {(step: CrStepperStep, i: number) => (
          <li {...ptAttrs(props.pt, "item")} data-part="item" data-state={state.status(i)} class={ptClass(props.pt, props.unstyled, "cr-stepper__item cr-stepper__item--" + state.status(i), "item")} aria-current={i === state.cur() ? "step" : undefined}>
            <Show when={props.onStep}>
              <button {...ptAttrs(props.pt, "btn")} type="button" data-part="btn" class={ptClass(props.pt, props.unstyled, "cr-stepper__btn", "btn")} onClick={() => props.onStep && props.onStep(i)}>
                <span {...ptAttrs(props.pt, "dot")} data-part="dot" class={ptClass(props.pt, props.unstyled, "cr-stepper__dot", "dot")} aria-hidden="true">{state.marker(i)}</span>
                <span {...ptAttrs(props.pt, "text")} data-part="text" class={ptClass(props.pt, props.unstyled, "cr-stepper__text", "text")}>
                  <span {...ptAttrs(props.pt, "label")} data-part="label" class={ptClass(props.pt, props.unstyled, "cr-stepper__label", "label")}>{step.label}</span>
                  <Show when={step.hint}>
                    <span {...ptAttrs(props.pt, "hint")} data-part="hint" class={ptClass(props.pt, props.unstyled, "cr-stepper__hint", "hint")}>{step.hint}</span>
                  </Show>
                </span>
              </button>
            </Show>
            <Show when={!props.onStep}>
              <span {...ptAttrs(props.pt, "dot")} data-part="dot" class={ptClass(props.pt, props.unstyled, "cr-stepper__dot", "dot")} aria-hidden="true">{state.marker(i)}</span>
              <span {...ptAttrs(props.pt, "text")} data-part="text" class={ptClass(props.pt, props.unstyled, "cr-stepper__text", "text")}>
                <span {...ptAttrs(props.pt, "label")} data-part="label" class={ptClass(props.pt, props.unstyled, "cr-stepper__label", "label")}>{step.label}</span>
                <Show when={step.hint}>
                  <span {...ptAttrs(props.pt, "hint")} data-part="hint" class={ptClass(props.pt, props.unstyled, "cr-stepper__hint", "hint")}>{step.hint}</span>
                </Show>
              </span>
            </Show>
          </li>
        )}
      </For>
    </ol>
  );
}
