import { useStore, Show, For } from "@builder.io/mitosis";

export interface CrFormField {
  name: string;
  /** text · email · url · number · select · textarea · checkbox · group · array. */
  kind: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** For `select`: the choices. */
  options?: { value: string; label: string }[];
  /** For `group`: the nested fields. */
  fields?: CrFormField[];
  /** For `array`: the descriptor of a single item (a scalar field or a group). */
  item?: CrFormField;
  itemLabel?: string;
  /** For `autocomplete`: options come from a static array, the field's enum
   *  `options`, or an async `(query) => Promise<{value,label}[]>`. */
  source?: { value: string; label: string }[] | ((query: string) => any);
  /** Conditional visibility — the field renders (and validates) only when this
   *  returns true for the current form values. Hidden fields are pruned from the
   *  validated payload, so a hidden required field never errors. */
  when?: (values: Record<string, any>) => boolean;
  min?: number;
  max?: number;
  step?: number | string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface CrFormProps {
  /** The Form Model — plain field descriptors (from the headless forms core). */
  fields: CrFormField[];
  values?: Record<string, any>;
  /** `(values) => errors | Promise<errors>` where errors is `{ [dottedPath]: msg }`
   *  ({} = valid). May be **async** (return a Promise) for server-side checks.
   *  Wire lib/forms here in targets where a function prop can return a value
   *  (React/Vue/Svelte/Solid/Angular). */
  validate?: (values: Record<string, any>) => Record<string, string> | Promise<Record<string, string>>;
  /** Controlled errors keyed by dotted path — always shown, merged over the
   *  internal validator's. Use this to feed back server-side errors, or to drive
   *  validation entirely from the parent (the Qwik-friendly path: validate in an
   *  async onChange/onSubmit handler and pass the result back here). */
  errors?: Record<string, string>;
  submitLabel?: string;
  /** Submit-button label while an async submit/validate is in flight. */
  pendingLabel?: string;
  /** Show a form-level error summary (role=alert, links to fields) after a failed
   *  submit. Default true. */
  errorSummary?: boolean;
  /** When a field FIRST validates: "blur" (default) · "change" · "submit". */
  mode?: string;
  /** After a field has validated once, when it re-checks: "change" (default) · "blur". */
  revalidateMode?: string;
  /** Show a Reset button (→ back to the seed `values`) while the form is dirty.
   *  Default true. */
  resettable?: boolean;
  resetLabel?: string;
  onReset?: () => void;
  title?: string;
  disabled?: boolean;
  id?: string;
  onChange?: (values: Record<string, any>) => void;
  /** May be async — the submit button shows its pending state until it settles. */
  onSubmit?: (values: Record<string, any>) => void | Promise<void>;
}

/* CrForm — a schema-driven form. Feed it a Form Model (which may nest: `group`
 * fields hold sub-fields, `array` fields repeat an item) and a validate()
 * function; it renders + validates the whole thing. It owns value/touched/error
 * state (keyed by dotted path, so `members.1.email` addresses one array item's
 * field), validates on blur + submit, and re-checks a field on change once
 * touched.
 *
 * Nesting is rendered from a FLAT render-list computed by walking the model + the
 * current values — the recursion lives in JS (`build`), the DOM stays flat and
 * indented by depth. That sidesteps component self-recursion (awkward across the
 * six targets) while supporting arbitrary depth. It never imports ArkType. State
 * + helpers are METHODS (a getter would run before the store initialises on
 * Qwik). See references/forms.md. */
export default function CrForm(props: CrFormProps) {
  const state = useStore({
    vals: props.values || {},
    /* the seed values — `dirty()` compares against this, `reset()` restores it */
    initial: props.values || {},
    errs: {},
    touched: {},
    submitted: false,
    submitting: false,
    /* autocomplete transient UI state, keyed by dotted field path */
    acQuery: {},
    acLabel: {},
    acOpen: {},
    acResults: {},
    acLoading: {},
    acActive: {},

    /* ── path helpers (path is an array of string keys / numeric indices) ── */
    key(path: any[]): string {
      return path.join(".");
    },
    cid(path: any[]): string {
      return (props.id || "cr-form") + "-" + path.join("-");
    },
    getDeep(root: any, path: any[]): any {
      let cur = root;
      for (const seg of path) {
        if (cur == null) return undefined;
        cur = cur[seg];
      }
      return cur;
    },
    setDeep(root: any, path: any[], value: any): any {
      if (path.length === 0) return value;
      const head = path[0];
      const isIndex = typeof head === "number";
      const base = root == null ? (isIndex ? [] : {}) : root;
      const clone = Array.isArray(base) ? base.slice() : { ...base };
      clone[head] = state.setDeep(clone[head], path.slice(1), value);
      return clone;
    },
    at(path: any[]): any {
      const v = state.getDeep(state.vals, path);
      return v == null ? "" : v;
    },
    showErr(path: any[]): string {
      const k = state.key(path);
      const own = state.submitted || state.touched[k] ? state.errs[k] || "" : "";
      const ext = props.errors ? props.errors[k] || "" : ""; /* controlled errors always show */
      return own || ext;
    },
    descId(path: any[]): string | undefined {
      if (state.showErr(path)) return state.cid(path) + "-err";
      return undefined;
    },

    /* ── kind helpers ── */
    isText(kind: string): boolean {
      return kind === "text" || kind === "email" || kind === "url";
    },
    inputType(kind: string): string {
      return kind === "email" ? "email" : kind === "url" ? "url" : "text";
    },
    opts(field: CrFormField): { value: string; label: string }[] {
      return field.options || [];
    },
    emptyItem(item: CrFormField): any {
      if (item.kind === "group") return {};
      if (item.kind === "checkbox") return false;
      return "";
    },

    /* ── conditional visibility ── */
    isHidden(field: CrFormField, values: any): boolean {
      return field.when ? !field.when(values || {}) : false;
    },
    /* A copy of `values` with hidden fields (and their subtrees) removed, so a
     * hidden required field never errors and its stale value isn't submitted.
     * `ctx` is the full form values the visibility predicates read. */
    pruneFields(fields: CrFormField[], values: any, ctx: any): any {
      const out: Record<string, any> = {};
      for (const f of fields) {
        if (state.isHidden(f, ctx)) continue;
        const v = values ? values[f.name] : undefined;
        if (f.kind === "group") {
          out[f.name] = state.pruneFields(f.fields || [], v || {}, ctx);
        } else if (f.kind === "array") {
          out[f.name] = Array.isArray(v)
            ? v.map((it: any) => (f.item && f.item.kind === "group" ? state.pruneFields(f.item.fields || [], it || {}, ctx) : it))
            : v;
        } else if (v !== undefined) {
          out[f.name] = v;
        }
      }
      return out;
    },
    pruned(values: any): any {
      return state.pruneFields(props.fields || [], values, values);
    },

    /* ── autocomplete (a select whose options come from a `source`) ──
     * source is a static array, or the field's enum `options`, or an async
     * (query) => Promise<{value,label}[]>. A real async source should debounce /
     * order its own responses; the component just renders whatever resolves. */
    acItems(path: any[]): any[] {
      return state.acResults[state.key(path)] || [];
    },
    acIsOpen(path: any[]): boolean {
      return !!state.acOpen[state.key(path)];
    },
    acIsLoading(path: any[]): boolean {
      return !!state.acLoading[state.key(path)];
    },
    acActiveIdx(path: any[]): number {
      return state.acActive[state.key(path)] || 0;
    },
    acDisplay(field: CrFormField, path: any[]): string {
      const k = state.key(path);
      if (state.acQuery[k] != null) return state.acQuery[k];
      if (state.acLabel[k] != null) return state.acLabel[k];
      const v = state.getDeep(state.vals, path);
      if (v == null || v === "") return "";
      const arr = Array.isArray(field.source) ? field.source : field.options || [];
      const o = arr.find((x: any) => String(x.value) === String(v));
      return o ? o.label : String(v);
    },
    acLoad(field: CrFormField, path: any[], query: string) {
      const k = state.key(path);
      const src = field.source;
      if (typeof src === "function") {
        state.acLoading = { ...state.acLoading, [k]: true };
        Promise.resolve(src(query)).then(
          (res: any) => {
            state.acResults = { ...state.acResults, [k]: res || [] };
            state.acLoading = { ...state.acLoading, [k]: false };
            state.acActive = { ...state.acActive, [k]: 0 };
          },
          () => {
            state.acResults = { ...state.acResults, [k]: [] };
            state.acLoading = { ...state.acLoading, [k]: false };
          },
        );
      } else {
        const arr = Array.isArray(src) ? src : field.options || [];
        const q = (query || "").trim().toLowerCase();
        const filtered = q ? arr.filter((o: any) => (o.label || "").toLowerCase().includes(q)) : arr;
        state.acResults = { ...state.acResults, [k]: filtered };
        state.acActive = { ...state.acActive, [k]: 0 };
      }
    },
    acOpenList(field: CrFormField, path: any[]) {
      const k = state.key(path);
      state.acOpen = { ...state.acOpen, [k]: true };
      state.acLoad(field, path, state.acQuery[k] != null ? state.acQuery[k] : "");
    },
    acInput(field: CrFormField, path: any[], text: string) {
      const k = state.key(path);
      state.acQuery = { ...state.acQuery, [k]: text };
      state.acOpen = { ...state.acOpen, [k]: true };
      state.acLoad(field, path, text);
    },
    acPick(field: CrFormField, path: any[], opt: any) {
      const k = state.key(path);
      state.acLabel = { ...state.acLabel, [k]: opt.label };
      const q = { ...state.acQuery };
      delete q[k];
      state.acQuery = q; /* stop typing mode; display falls back to the label */
      state.acOpen = { ...state.acOpen, [k]: false };
      state.setField(path, opt.value);
    },
    acClose(path: any[]) {
      const k = state.key(path);
      state.acOpen = { ...state.acOpen, [k]: false };
      const q = { ...state.acQuery };
      delete q[k];
      state.acQuery = q; /* discard an un-picked query; revert to the selected label */
      state.blur(path);
    },
    acMove(path: any[], delta: number) {
      const k = state.key(path);
      const res = state.acResults[k] || [];
      if (!res.length) return;
      const cur = state.acActive[k] || 0;
      state.acActive = { ...state.acActive, [k]: (cur + delta + res.length) % res.length };
    },
    acKeydown(field: CrFormField, path: any[], event: any) {
      const k = state.key(path);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (state.acOpen[k]) state.acMove(path, 1);
        else state.acOpenList(field, path);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        state.acMove(path, -1);
      } else if (event.key === "Enter") {
        const res = state.acResults[k] || [];
        const a = state.acActive[k] || 0;
        if (state.acOpen[k] && res[a]) {
          event.preventDefault();
          state.acPick(field, path, res[a]);
        }
      } else if (event.key === "Escape") {
        state.acOpen = { ...state.acOpen, [k]: false };
      }
    },

    /* ── the flat render-list (recursion in JS, flat DOM) ── */
    build(fields: CrFormField[], prefix: any[], depth: number, out: any[]) {
      for (const f of fields) {
        if (state.isHidden(f, state.vals)) continue;
        const path = prefix.concat([f.name]);
        if (f.kind === "group") {
          out.push({ t: "group", path, field: f, depth });
          state.build(f.fields || [], path, depth + 1, out);
        } else if (f.kind === "array") {
          out.push({ t: "array", path, field: f, depth });
          const arr = state.getDeep(state.vals, path) || [];
          for (let i = 0; i < arr.length; i++) {
            const itemPath = path.concat([i]);
            const isGroup = f.item && f.item.kind === "group";
            if (isGroup) {
              /* object item: header row (with remove) + the item fields */
              out.push({ t: "item", path: itemPath, field: f, index: i, depth: depth + 1 });
              state.build(f.item.fields || [], itemPath, depth + 2, out);
            } else {
              /* scalar item: a single field row carrying an inline remove */
              out.push({ t: "field", path: itemPath, field: f.item, depth: depth + 1, scalarItem: true });
            }
          }
        } else {
          out.push({ t: "field", path, field: f, depth });
        }
      }
    },
    rows(): any[] {
      const out: any[] = [];
      state.build(props.fields || [], [], 0, out);
      return out;
    },
    pad(depth: number): string {
      return depth * 14 + "px";
    },

    /* Cheap gate for the error summary — a scan of the (small) error maps, with
     * NO model walk. The full errorList() (which walks the render-list to pair
     * each error with a field label) then runs only when a summary is actually
     * shown, not on every keystroke. */
    hasSummary(): boolean {
      if (props.errorSummary === false) return false;
      if (state.submitted) for (const k in state.errs) if (state.errs[k]) return true;
      if (props.errors) for (const k in props.errors) if (props.errors[k]) return true;
      return false;
    },
    /* Form-level error summary: every current error paired with its field label,
     * for the role=alert region + in-page links after a failed submit. */
    errorList(): any[] {
      const labelByKey: Record<string, string> = {};
      const list = state.rows();
      for (const r of list) if (r.t === "field") labelByKey[state.key(r.path)] = r.field.label;
      const merged: Record<string, string> = {};
      if (state.submitted) for (const k in state.errs) if (state.errs[k]) merged[k] = state.errs[k];
      if (props.errors) for (const k in props.errors) if (props.errors[k]) merged[k] = props.errors[k];
      return Object.keys(merged).map((k) => ({
        key: k,
        label: labelByKey[k] || k,
        msg: merged[k],
        cid: (props.id || "cr-form") + "-" + k.split(".").join("-"),
      }));
    },
    submitBtnLabel(): string {
      if (state.submitting) return props.pendingLabel || "Submitting…";
      return props.submitLabel || "Submit";
    },

    /* ── validation modes ──
     * `mode` = when a field FIRST validates (blur | change | submit);
     * `revalidateMode` = once it has validated once, when it re-checks
     * (change | blur). A field that has errored is always live-revalidated so a
     * fix clears the message as expected. */
    mode(): string {
      return props.mode || "blur";
    },
    revalidateMode(): string {
      return props.revalidateMode || "change";
    },
    isLive(path: any[]): boolean {
      /* "live" = already validated once (touched or a submit has happened) */
      return state.submitted || !!state.touched[state.key(path)];
    },

    /* ── dirty / reset ── */
    dirty(): boolean {
      return JSON.stringify(state.vals) !== JSON.stringify(state.initial);
    },
    reset() {
      const base = JSON.parse(JSON.stringify(state.initial || {}));
      state.vals = base;
      state.errs = {};
      state.touched = {};
      state.submitted = false;
      state.submitting = false;
      state.acQuery = {};
      state.acLabel = {};
      state.acOpen = {};
      state.acResults = {};
      state.acLoading = {};
      state.acActive = {};
      if (props.onChange) props.onChange(base);
      if (props.onReset) props.onReset();
    },

    /* ── mutation + validation (validate may be sync OR async) ── */
    revalidate(nextVals: any) {
      if (props.validate) Promise.resolve(props.validate(state.pruned(nextVals)) || {}).then((e: any) => { state.errs = e || {}; });
    },
    setField(path: any[], value: any) {
      const next = state.setDeep(state.vals, path, value);
      state.vals = next;
      if (props.onChange) props.onChange(next);
      const k = state.key(path);
      if (state.isLive(path)) {
        /* already validated once — re-check on change if that's the revalidate mode */
        if (state.revalidateMode() === "change" || state.errs[k]) state.revalidate(next);
      } else if (state.mode() === "change") {
        /* first validation happens on change */
        state.touched = { ...state.touched, [k]: true };
        state.revalidate(next);
      }
    },
    blur(path: any[]) {
      const k = state.key(path);
      if (state.isLive(path)) {
        if (state.revalidateMode() === "blur") state.revalidate(state.vals);
      } else if (state.mode() === "blur") {
        state.touched = { ...state.touched, [k]: true };
        state.revalidate(state.vals);
      }
      /* mode "submit": neither blur nor change validates before the first submit */
    },
    addItem(path: any[], item: CrFormField) {
      const arr = state.getDeep(state.vals, path) || [];
      const next = state.setDeep(state.vals, path, arr.concat([state.emptyItem(item)]));
      state.vals = next;
      if (props.onChange) props.onChange(next);
    },
    removeItem(path: any[], index: number) {
      const arr = (state.getDeep(state.vals, path) || []).slice();
      arr.splice(index, 1);
      const next = state.setDeep(state.vals, path, arr);
      state.vals = next;
      if (props.onChange) props.onChange(next);
      if (state.submitted) state.revalidate(next);
    },
    submit(event: any) {
      event.preventDefault();
      const values = state.vals;
      state.submitted = true;
      state.submitting = true;
      /* validate may be sync or async — normalise with Promise.resolve; the
       * button stays in its pending state until validate AND onSubmit settle. */
      const payload = state.pruned(values); /* drop hidden fields from validation + submit */
      Promise.resolve(props.validate ? props.validate(payload) || {} : {}).then((e: any) => {
        const errs = e || {};
        state.errs = errs;
        const t: Record<string, boolean> = {};
        for (const k of Object.keys(errs)) t[k] = true;
        state.touched = t;
        if (Object.keys(errs).length === 0 && props.onSubmit) {
          Promise.resolve(props.onSubmit(payload)).then(
            () => { state.submitting = false; },
            () => { state.submitting = false; },
          );
        } else {
          state.submitting = false;
        }
      });
    },
  });

  return (
    <form class="cr-form" noValidate onSubmit={(event) => state.submit(event)}>
      <Show when={props.title}>
        <h3 class="cr-form__title">{props.title}</h3>
      </Show>
      <Show when={state.hasSummary()}>
        <div class="cr-form__summary" role="alert">
          <span class="cr-form__summary-title">{state.errorList().length + " to fix"}</span>
          <ul class="cr-form__summary-list">
            <For each={state.errorList()}>
              {(e: { key: string; label: string; msg: string; cid: string }) => (
                <li><a class="cr-form__summary-link" href={"#" + e.cid}>{e.label}</a> — {e.msg}</li>
              )}
            </For>
          </ul>
        </div>
      </Show>
      <For each={state.rows()}>
        {(row: any) => (
          <div
            class={"cr-form__row cr-form__row--" + row.t + (row.t === "field" && state.showErr(row.path) ? " cr-field--error" : "")}
            style={{ paddingLeft: state.pad(row.depth) }}
          >
            {/* group header */}
            <Show when={row.t === "group"}>
              <div class="cr-form__grouphead">{row.field.label}</div>
            </Show>

            {/* array header + add */}
            <Show when={row.t === "array"}>
              <div class="cr-form__arrayhead">
                <span class="cr-form__grouphead">{row.field.label}</span>
                <button type="button" class="cr-btn cr-btn--sm cr-btn--ghost" disabled={props.disabled} onClick={() => state.addItem(row.path, row.field.item)}>
                  + add
                </button>
              </div>
            </Show>

            {/* array item header (object items) + remove */}
            <Show when={row.t === "item"}>
              <div class="cr-form__itemhead">
                <span class="cr-form__itemidx">{(row.field.itemLabel || "#") + " " + (row.index + 1)}</span>
                <button type="button" class="cr-btn cr-btn--sm cr-btn--ghost cr-btn--sig-err" disabled={props.disabled} onClick={() => state.removeItem(row.path.slice(0, -1), row.index)}>
                  remove
                </button>
              </div>
            </Show>

            {/* leaf field */}
            <Show when={row.t === "field"}>
              <Show when={row.field.kind === "checkbox"}>
                <label class="cr-check">
                  <input
                    type="checkbox"
                    checked={state.at(row.path) === true}
                    disabled={props.disabled}
                    aria-describedby={state.descId(row.path)}
                    onChange={(event) => state.setField(row.path, (event.target as HTMLInputElement).checked)}
                    onBlur={() => state.blur(row.path)}
                  />
                  {row.field.label}
                </label>
              </Show>

              <Show when={row.field.kind !== "checkbox"}>
                <Show when={!row.scalarItem}>
                  <label class="cr-field__label" for={state.cid(row.path)}>
                    {row.field.label}
                    <Show when={row.field.required}>
                      <span class="cr-field__req" aria-hidden="true"> *</span>
                    </Show>
                  </label>
                </Show>

                <div class="cr-form__control">
                  <Show when={state.isText(row.field.kind)}>
                    <input
                      id={state.cid(row.path)}
                      class="cr-input"
                      type={state.inputType(row.field.kind)}
                      value={state.at(row.path)}
                      placeholder={row.field.placeholder}
                      disabled={props.disabled}
                      required={row.field.required}
                      aria-required={row.field.required ? "true" : undefined}
                      aria-invalid={state.showErr(row.path) ? "true" : "false"}
                      aria-describedby={state.descId(row.path)}
                      onInput={(event) => state.setField(row.path, (event.target as HTMLInputElement).value)}
                      onBlur={() => state.blur(row.path)}
                    />
                  </Show>

                  <Show when={row.field.kind === "number"}>
                    <input
                      id={state.cid(row.path)}
                      class="cr-input"
                      type="number"
                      value={state.at(row.path)}
                      placeholder={row.field.placeholder}
                      disabled={props.disabled}
                      required={row.field.required}
                      min={row.field.min}
                      max={row.field.max}
                      step={row.field.step}
                      aria-required={row.field.required ? "true" : undefined}
                      aria-invalid={state.showErr(row.path) ? "true" : "false"}
                      aria-describedby={state.descId(row.path)}
                      onInput={(event) => state.setField(row.path, (event.target as HTMLInputElement).value)}
                      onBlur={() => state.blur(row.path)}
                    />
                  </Show>

                  <Show when={row.field.kind === "select"}>
                    <select
                      id={state.cid(row.path)}
                      class="cr-select"
                      value={state.at(row.path)}
                      disabled={props.disabled}
                      required={row.field.required}
                      aria-required={row.field.required ? "true" : undefined}
                      aria-invalid={state.showErr(row.path) ? "true" : "false"}
                      aria-describedby={state.descId(row.path)}
                      onChange={(event) => state.setField(row.path, (event.target as HTMLSelectElement).value)}
                      onBlur={() => state.blur(row.path)}
                    >
                      <option value="">{row.field.placeholder || "Select…"}</option>
                      <For each={state.opts(row.field)}>
                        {(o: { value: string; label: string }) => <option value={o.value}>{o.label}</option>}
                      </For>
                    </select>
                  </Show>

                  <Show when={row.field.kind === "textarea" || row.field.kind === "json"}>
                    <textarea
                      id={state.cid(row.path)}
                      class="cr-textarea"
                      value={state.at(row.path)}
                      placeholder={row.field.placeholder}
                      disabled={props.disabled}
                      required={row.field.required}
                      aria-required={row.field.required ? "true" : undefined}
                      aria-invalid={state.showErr(row.path) ? "true" : "false"}
                      aria-describedby={state.descId(row.path)}
                      onInput={(event) => state.setField(row.path, (event.target as HTMLTextAreaElement).value)}
                      onBlur={() => state.blur(row.path)}
                    ></textarea>
                  </Show>

                  <Show when={row.field.kind === "autocomplete"}>
                    <div class="cr-combobox">
                      <input
                        id={state.cid(row.path)}
                        class="cr-combobox__input"
                        type="text"
                        role="combobox"
                        autocomplete="off"
                        value={state.acDisplay(row.field, row.path)}
                        placeholder={row.field.placeholder}
                        disabled={props.disabled}
                        required={row.field.required}
                        aria-required={row.field.required ? "true" : undefined}
                        aria-expanded={state.acIsOpen(row.path) ? "true" : "false"}
                        aria-autocomplete="list"
                        aria-controls={state.cid(row.path) + "-list"}
                        aria-invalid={state.showErr(row.path) ? "true" : "false"}
                        aria-describedby={state.descId(row.path)}
                        onInput={(event) => state.acInput(row.field, row.path, (event.target as HTMLInputElement).value)}
                        onFocus={() => state.acOpenList(row.field, row.path)}
                        onKeyDown={(event) => state.acKeydown(row.field, row.path, event)}
                        onBlur={() => state.acClose(row.path)}
                      />
                      <Show when={state.acIsOpen(row.path)}>
                        <ul class="cr-combobox__list" role="listbox" id={state.cid(row.path) + "-list"}>
                          <Show when={state.acIsLoading(row.path)}>
                            <li class="cr-combobox__empty">searching…</li>
                          </Show>
                          <For each={state.acItems(row.path)}>
                            {(o: { value: string; label: string }, i: number) => (
                              <li
                                class={"cr-combobox__opt" + (state.acActiveIdx(row.path) === i ? " cr-combobox__opt--active" : "")}
                                role="option"
                                aria-selected={state.acActiveIdx(row.path) === i ? "true" : "false"}
                                onMouseDown={() => state.acPick(row.field, row.path, o)}
                              >
                                {o.label}
                              </li>
                            )}
                          </For>
                          <Show when={!state.acIsLoading(row.path) && state.acItems(row.path).length === 0}>
                            <li class="cr-combobox__empty">no matches</li>
                          </Show>
                        </ul>
                      </Show>
                    </div>
                  </Show>

                  {/* scalar array item: an inline remove */}
                  <Show when={row.scalarItem}>
                    <button type="button" class="cr-btn cr-btn--sm cr-btn--ghost cr-btn--sig-err" disabled={props.disabled} onClick={() => state.removeItem(row.path.slice(0, -1), row.path[row.path.length - 1])}>
                      ✕
                    </button>
                  </Show>
                </div>
              </Show>

              <Show when={row.field.hint && !state.showErr(row.path)}>
                <span class="cr-field__hint">{row.field.hint}</span>
              </Show>
              <Show when={state.showErr(row.path)}>
                <span class="cr-field__error" id={state.cid(row.path) + "-err"} role="alert">{state.showErr(row.path)}</span>
              </Show>
            </Show>
          </div>
        )}
      </For>
      <div class="cr-form__actions">
        <button type="submit" class="cr-btn" disabled={props.disabled || state.submitting} aria-busy={state.submitting ? "true" : undefined}>
          {state.submitBtnLabel()}
        </button>
        <Show when={props.resettable !== false && state.dirty()}>
          <button type="button" class="cr-btn cr-btn--ghost" disabled={props.disabled || state.submitting} onClick={() => state.reset()}>
            {props.resetLabel || "Reset"}
          </button>
        </Show>
      </div>
    </form>
  );
}
