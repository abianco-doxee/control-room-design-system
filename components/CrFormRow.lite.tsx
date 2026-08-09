import { Show, For, onUpdate } from "@builder.io/mitosis";
import { ptClass, ptAttrs } from "../lib/pt.ts";

export interface CrFormRowProps {
  /** "group" · "array" · "item" · "field" — the render-list row kind. */
  rowType: string;
  /** The field descriptor (a CrFormField from CrForm's model). Referentially
   *  STABLE across CrForm renders (it comes straight from `props.fields`), which
   *  is what lets React.memo skip this row when only a sibling's value changed.
   *  Typed `any` to avoid a cross-.lite type import (which Mitosis would emit as a
   *  value import of CrForm). */
  field: any;
  /** Dotted path key (e.g. `members.1.email`) — carried on every interactive
   *  element as `data-path` so CrForm's delegated handlers can address it. */
  pathKey: string;
  /** Control id (== CrForm's `cid(path)`) for label/for + aria wiring. */
  cid: string;
  /** aria-describedby target, or undefined. */
  descId?: string;
  /** Left ind: `depth * 14px`, precomputed by the parent. */
  padLeft: string;
  index?: number;
  scalarItem?: boolean;
  /** Current value (leaf fields). Primitive → memo-comparable. */
  value?: any;
  /** Resolved, showable error message ("" when none). */
  error?: string;
  disabled?: boolean;
  /** For `array` rows: the item kind, so the delegated "+ add" click can seed a
   *  new item without re-deriving the descriptor. */
  itemKind?: string;
  /* ── autocomplete display state (all primitive / stable) ── */
  acDisplay?: string;
  acOpen?: boolean;
  acLoading?: boolean;
  acItems?: { value: string; label: string }[];
  acActiveIdx?: number;
  /* ── styling contract (portable pt/dt subset). Single wired part: "root" (the
   * row wrapper). This is CrForm's internal presentational row, so pt/unstyled
   * apply at the row level; the row keeps its computed paddingLeft style. */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* CrFormRow — the presentational half of CrForm. One render-list row (a field, a
 * group/array header, or an array-item header) rendered from PLAIN DATA props and
 * NOTHING ELSE: no function props, no store access. Every interactive element
 * carries `data-path` / `data-kind` / `data-action` so CrForm handles input via a
 * single set of DELEGATED listeners on the <form> — which keeps this component
 * free of the per-render closures that would otherwise defeat React.memo.
 *
 * Why that matters: Mitosis compiles a store keystroke to a React setState, which
 * re-renders CrForm. Wrapping THIS child in React.memo (see build-fix-react.mjs)
 * means only the row whose value/error prop actually changed re-renders — the
 * other rows bail out on a shallow prop compare. The fine-grained targets
 * (Solid/Vue/Svelte/Qwik) already update per-binding; delegation is inert there.
 *
 * The no-op `onChange` on each controlled input is deliberate: React warns about a
 * controlled `value` with no change handler, and the real update flows through the
 * form's delegated listener, not this handler. See references/forms.md. */
export default function CrFormRow(props: CrFormRowProps) {
  /* Render probe (guarded, zero-cost unless a test opts in). Compiles to a React
   * effect that runs on every COMMIT of this row — so if React.memo bails a row
   * out (its props didn't change), no commit fires and its counter stays put.
   * That lets a Playwright test assert per-field isolation: typing in one field
   * must not tick its siblings' counters. It's a React-only signal by nature (the
   * fine-grained targets don't re-render components), which is exactly the target
   * whose coarseness this refactor fixes. */
  onUpdate(() => {
    if (typeof window !== "undefined" && (window as any).__CR_ROW_RENDERS__) {
      const w = window as any;
      w.__CR_ROW_RENDERS__[props.pathKey] = (w.__CR_ROW_RENDERS__[props.pathKey] || 0) + 1;
    }
  });

  return (
    <div
      {...ptAttrs(props.pt, "root")}
      class={ptClass(props.pt, props.unstyled, "cr-form__row cr-form__row--" + props.rowType + (props.rowType === "field" && props.error ? " cr-field--error" : ""), "root")}
      data-part="root"
      style={{ paddingLeft: props.padLeft }}
    >
      {/* group header */}
      <Show when={props.rowType === "group"}>
        <div class="cr-form__grouphead">{props.field.label}</div>
      </Show>

      {/* array header + add */}
      <Show when={props.rowType === "array"}>
        <div class="cr-form__arrayhead">
          <span class="cr-form__grouphead">{props.field.label}</span>
          <button type="button" class="cr-btn cr-btn--sm cr-btn--ghost" disabled={props.disabled} data-action="add" data-path={props.pathKey} data-itemkind={props.itemKind}>
            + add
          </button>
        </div>
      </Show>

      {/* array item header (object items) + remove */}
      <Show when={props.rowType === "item"}>
        <div class="cr-form__itemhead">
          <span class="cr-form__itemidx">{(props.field.itemLabel || "#") + " " + ((props.index || 0) + 1)}</span>
          <button type="button" class="cr-btn cr-btn--sm cr-btn--ghost cr-btn--sig-err" disabled={props.disabled} data-action="remove" data-path={props.pathKey}>
            remove
          </button>
        </div>
      </Show>

      {/* leaf field */}
      <Show when={props.rowType === "field"}>
        <Show when={props.field.kind === "checkbox"}>
          <label class="cr-check">
            <input
              type="checkbox"
              checked={props.value === true}
              disabled={props.disabled}
              aria-describedby={props.descId}
              data-path={props.pathKey}
              data-kind="checkbox"
              onChange={() => {}}
            />
            {props.field.label}
          </label>
        </Show>

        <Show when={props.field.kind !== "checkbox"}>
          <Show when={!props.scalarItem}>
            <label class="cr-field__label" for={props.cid}>
              {props.field.label}
              <Show when={props.field.required}>
                <span class="cr-field__req" aria-hidden="true"> *</span>
              </Show>
            </label>
          </Show>

          <div class="cr-form__control">
            <Show when={props.field.kind === "text" || props.field.kind === "email" || props.field.kind === "url"}>
              <input
                id={props.cid}
                class="cr-input"
                type={props.field.kind === "email" ? "email" : props.field.kind === "url" ? "url" : "text"}
                value={props.value}
                placeholder={props.field.placeholder}
                disabled={props.disabled}
                required={props.field.required}
                aria-required={props.field.required ? "true" : undefined}
                aria-invalid={props.error ? "true" : "false"}
                aria-describedby={props.descId}
                data-path={props.pathKey}
                data-kind={props.field.kind}
                onChange={() => {}}
              />
            </Show>

            <Show when={props.field.kind === "number"}>
              <input
                id={props.cid}
                class="cr-input"
                type="number"
                value={props.value}
                placeholder={props.field.placeholder}
                disabled={props.disabled}
                required={props.field.required}
                min={props.field.min}
                max={props.field.max}
                step={props.field.step}
                aria-required={props.field.required ? "true" : undefined}
                aria-invalid={props.error ? "true" : "false"}
                aria-describedby={props.descId}
                data-path={props.pathKey}
                data-kind="number"
                onChange={() => {}}
              />
            </Show>

            <Show when={props.field.kind === "select"}>
              <select
                id={props.cid}
                class="cr-select"
                value={props.value}
                disabled={props.disabled}
                required={props.field.required}
                aria-required={props.field.required ? "true" : undefined}
                aria-invalid={props.error ? "true" : "false"}
                aria-describedby={props.descId}
                data-path={props.pathKey}
                data-kind="select"
                onChange={() => {}}
              >
                <option value="">{props.field.placeholder || "Select…"}</option>
                <For each={props.field.options}>
                  {(o: { value: string; label: string }) => <option value={o.value}>{o.label}</option>}
                </For>
              </select>
            </Show>

            <Show when={props.field.kind === "textarea" || props.field.kind === "json"}>
              <textarea
                id={props.cid}
                class="cr-textarea"
                value={props.value}
                placeholder={props.field.placeholder}
                disabled={props.disabled}
                required={props.field.required}
                aria-required={props.field.required ? "true" : undefined}
                aria-invalid={props.error ? "true" : "false"}
                aria-describedby={props.descId}
                data-path={props.pathKey}
                data-kind="textarea"
                onChange={() => {}}
              ></textarea>
            </Show>

            <Show when={props.field.kind === "autocomplete"}>
              <div class="cr-combobox">
                <input
                  id={props.cid}
                  class="cr-combobox__input"
                  type="text"
                  role="combobox"
                  autocomplete="off"
                  value={props.acDisplay}
                  placeholder={props.field.placeholder}
                  disabled={props.disabled}
                  required={props.field.required}
                  aria-required={props.field.required ? "true" : undefined}
                  aria-expanded={props.acOpen ? "true" : "false"}
                  aria-autocomplete="list"
                  aria-controls={props.cid + "-list"}
                  aria-invalid={props.error ? "true" : "false"}
                  aria-describedby={props.descId}
                  data-path={props.pathKey}
                  data-kind="autocomplete"
                  onChange={() => {}}
                />
                <Show when={props.acOpen}>
                  <ul class="cr-combobox__list" role="listbox" id={props.cid + "-list"}>
                    <Show when={props.acLoading}>
                      <li class="cr-combobox__empty">searching…</li>
                    </Show>
                    <For each={props.acItems}>
                      {(o: { value: string; label: string }, i: number) => (
                        <li
                          class={"cr-combobox__opt" + (props.acActiveIdx === i ? " cr-combobox__opt--active" : "")}
                          role="option"
                          aria-selected={props.acActiveIdx === i ? "true" : "false"}
                          data-path={props.pathKey}
                          data-idx={i}
                        >
                          {o.label}
                        </li>
                      )}
                    </For>
                    <Show when={!props.acLoading && (props.acItems || []).length === 0}>
                      <li class="cr-combobox__empty">no matches</li>
                    </Show>
                  </ul>
                </Show>
              </div>
            </Show>

            {/* scalar array item: an inline remove */}
            <Show when={props.scalarItem}>
              <button type="button" class="cr-btn cr-btn--sm cr-btn--ghost cr-btn--sig-err" disabled={props.disabled} data-action="remove" data-path={props.pathKey}>
                ✕
              </button>
            </Show>
          </div>
        </Show>

        <Show when={props.field.hint && !props.error}>
          <span class="cr-field__hint">{props.field.hint}</span>
        </Show>
        <Show when={props.error}>
          <span class="cr-field__error" id={props.cid + "-err"} role="alert">{props.error}</span>
        </Show>
      </Show>
    </div>
  );
}
