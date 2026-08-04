import { Show, For } from "@builder.io/mitosis";

export interface CrCronPreset {
  label: string;
  cron: string;
}

export interface CrCronFieldProps {
  value: string;
  /** Quick-fill presets. */
  presets?: CrCronPreset[];
  /** Human-readable translation of `value` — the host computes this (e.g. with
   *  cronstrue) and passes it in, so the design system stays dependency-free. */
  description?: string;
  /** Mark the description as an error (unparseable expression). */
  invalid?: boolean;
  label?: string;
  onChange?: (value: string) => void;
}

/* A cron-expression field with quick presets and a live human-readable readout.
 * The translation is injected as `description` (compute it with cronstrue or any
 * parser in the host) — the component only displays it. Styling via .cr-cron. */
export default function CrCronField(props: CrCronFieldProps) {
  return (
    <div class="cr-cron">
      <input
        class="cr-cron__input"
        type="text"
        spellcheck={false}
        value={props.value}
        aria-label={props.label || "Cron expression"}
        aria-invalid={props.invalid ? "true" : "false"}
        placeholder="* * * * *"
        onInput={(event) => props.onChange && props.onChange((event.target as HTMLInputElement).value)}
      />
      <Show when={props.presets}>
        <div class="cr-cron__presets">
          <For each={props.presets}>
            {(pre: CrCronPreset) => (
              <button type="button" class="cr-cron__preset" onClick={() => props.onChange && props.onChange(pre.cron)}>
                {pre.label}
              </button>
            )}
          </For>
        </div>
      </Show>
      <Show when={props.description}>
        <p class={"cr-cron__out" + (props.invalid ? " cr-cron__out--err" : "")} aria-live="polite">
          {props.description}
        </p>
      </Show>
    </div>
  );
}
