import { useStore, For, Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

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
  pt?: CrPassThrough<"btn" | "dot" | "hint" | "item" | "label" | "root" | "text">;
  dt?: CrDesignTokens;
}

/* Stepper — a numbered progress indicator for a multi-step flow (the shape the
 * forms guidance points to when a form is split into steps). Rendered as an
 * ordered list; the current step carries aria-current="step", done steps show a
 * check. Pass onStep to make steps navigable buttons (native focus/activation);
 * omit it for a read-only indicator. Styling via .cr-stepper. */
export default function CrStepper(props: CrStepperProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrStepper"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrStepper"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrStepper"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

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
    <ol {...ptAttrs(ptResolve(cr, props.pt, "CrStepper"), "root")} data-part="root" class={ptClass(ptResolve(cr, props.pt, "CrStepper"), props.unstyled, "cr-stepper", "root")} style={ptStyle(ptResolve(cr, props.pt, "CrStepper"), props.dt, "root")}>
      <For each={props.steps}>
        {(step: CrStepperStep, i: number) => (
          <li {...ptAttrs(ptResolve(cr, props.pt, "CrStepper"), "item")} data-part="item" data-state={state.status(i)} class={ptClass(ptResolve(cr, props.pt, "CrStepper"), props.unstyled, "cr-stepper__item cr-stepper__item--" + state.status(i), "item")} aria-current={i === state.cur() ? "step" : undefined}>
            <Show when={props.onStep}>
              <button {...ptAttrs(ptResolve(cr, props.pt, "CrStepper"), "btn")} type="button" data-part="btn" class={ptClass(ptResolve(cr, props.pt, "CrStepper"), props.unstyled, "cr-stepper__btn", "btn")} onClick={() => props.onStep && props.onStep(i)}>
                <span {...ptAttrs(ptResolve(cr, props.pt, "CrStepper"), "dot")} data-part="dot" class={ptClass(ptResolve(cr, props.pt, "CrStepper"), props.unstyled, "cr-stepper__dot", "dot")} aria-hidden="true">{state.marker(i)}</span>
                <span {...ptAttrs(ptResolve(cr, props.pt, "CrStepper"), "text")} data-part="text" class={ptClass(ptResolve(cr, props.pt, "CrStepper"), props.unstyled, "cr-stepper__text", "text")}>
                  <span {...ptAttrs(ptResolve(cr, props.pt, "CrStepper"), "label")} data-part="label" class={ptClass(ptResolve(cr, props.pt, "CrStepper"), props.unstyled, "cr-stepper__label", "label")}>{step.label}</span>
                  <Show when={step.hint}>
                    <span {...ptAttrs(ptResolve(cr, props.pt, "CrStepper"), "hint")} data-part="hint" class={ptClass(ptResolve(cr, props.pt, "CrStepper"), props.unstyled, "cr-stepper__hint", "hint")}>{step.hint}</span>
                  </Show>
                </span>
              </button>
            </Show>
            <Show when={!props.onStep}>
              <span {...ptAttrs(ptResolve(cr, props.pt, "CrStepper"), "dot")} data-part="dot" class={ptClass(ptResolve(cr, props.pt, "CrStepper"), props.unstyled, "cr-stepper__dot", "dot")} aria-hidden="true">{state.marker(i)}</span>
              <span {...ptAttrs(ptResolve(cr, props.pt, "CrStepper"), "text")} data-part="text" class={ptClass(ptResolve(cr, props.pt, "CrStepper"), props.unstyled, "cr-stepper__text", "text")}>
                <span {...ptAttrs(ptResolve(cr, props.pt, "CrStepper"), "label")} data-part="label" class={ptClass(ptResolve(cr, props.pt, "CrStepper"), props.unstyled, "cr-stepper__label", "label")}>{step.label}</span>
                <Show when={step.hint}>
                  <span {...ptAttrs(ptResolve(cr, props.pt, "CrStepper"), "hint")} data-part="hint" class={ptClass(ptResolve(cr, props.pt, "CrStepper"), props.unstyled, "cr-stepper__hint", "hint")}>{step.hint}</span>
                </Show>
              </span>
            </Show>
          </li>
        )}
      </For>
    </ol>
  );
}
