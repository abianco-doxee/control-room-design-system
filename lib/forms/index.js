/**
 * Control Room — headless form core.
 *
 * A framework-agnostic bridge between a *schema* and a renderable, validatable
 * form. It accepts EITHER an ArkType type OR a JSON Schema (bidirectional), and
 * normalises both to:
 *   - a JSON Schema (the portable, backend-shareable lingua franca),
 *   - a **Form Model** (plain field descriptors a UI can render), and
 *   - a **validate(values)** function backed by ArkType (one engine, both ways).
 *
 * Nothing here is UI-framework-specific — the Control Room components consume the
 * Form Model + validate() as plain data, so they never import ArkType and stay
 * portable across all six Mitosis targets. See references/forms.md.
 *
 * Nesting: object properties become `group` fields (with sub-`fields`) and array
 * properties become `array` fields (with an `item` descriptor — a scalar field or
 * a group). Values nest to match; validation error paths are dotted (with array
 * indices), e.g. `members.1.email`.
 */
import { type } from "arktype";

/* ─────────────────────────── schema detection ─────────────────────────── */

/** An ArkType type is a callable with a `.toJsonSchema()` method. */
export function isArkType(schema) {
  return typeof schema === "function" && typeof schema.toJsonSchema === "function";
}

/** A JSON Schema (for our purposes) is a plain object describing an object type. */
export function isJsonSchema(schema) {
  return (
    schema && typeof schema === "object" && !Array.isArray(schema) &&
    (schema.type === "object" || schema.properties || schema.$schema)
  );
}

/* ───────────────────────── ArkType → JSON Schema ──────────────────────── */

/** Normalise any accepted schema to a JSON Schema object.
 *
 * Some ArkType constraints are predicates (e.g. `string.url`, which validates via
 * `new URL()`) with no exact JSON-Schema form; ArkType throws on those by default.
 * We pass a `fallback` that degrades a predicate to its base type (keeping a known
 * `format` where ArkType has one) so export never hard-crashes. Runtime validation
 * still uses the full ArkType type — only the exported JSON Schema is approximate. */
export function toJsonSchema(schema) {
  if (isArkType(schema)) return schema.toJsonSchema({ fallback: (ctx) => (ctx && ctx.base) || {} });
  if (isJsonSchema(schema)) return schema;
  throw new TypeError("Unsupported schema: pass an ArkType type or a JSON Schema object.");
}

/* ───────────────────────── JSON Schema → ArkType ──────────────────────── */

function literal(v) {
  return typeof v === "string" ? `'${v.replace(/'/g, "\\'")}'` : String(v);
}

/** Convert one JSON-Schema property to an ArkType definition value (recursive). */
function propToArkDef(prop) {
  // enum / const → a literal union
  if (Array.isArray(prop.enum)) return prop.enum.map(literal).join(" | ") || "never";
  if ("const" in prop) return literal(prop.const);

  const t = prop.type;

  // nested object → a nested definition object
  if (t === "object" && prop.properties) return jsonSchemaToArkDef(prop);

  // array → item type, arrayed (works for scalar and object items alike)
  if (t === "array") return type(propToArkDef(prop.items || {})).array();

  if (t === "boolean") return "boolean";

  if (t === "integer" || t === "number") {
    const base = t === "integer" ? "number.integer" : "number";
    const lo = prop.exclusiveMinimum ?? prop.minimum;
    const hi = prop.exclusiveMaximum ?? prop.maximum;
    const loOp = prop.exclusiveMinimum != null ? ">" : ">=";
    const hiOp = prop.exclusiveMaximum != null ? "<" : "<=";
    // Apply each bound as its own constraint and intersect — avoids the
    // ambiguity of chaining two comparators on one token.
    if (lo != null && hi != null) return type(`${base} ${loOp} ${lo}`).and(`${base} ${hiOp} ${hi}`);
    if (lo != null) return `${base} ${loOp} ${lo}`;
    if (hi != null) return `${base} ${hiOp} ${hi}`;
    return base;
  }

  // strings (default when no type given but string-ish keywords present)
  if (t === "string" || prop.format || prop.pattern != null || prop.minLength != null || prop.maxLength != null) {
    if (prop.format === "email") return "string.email";
    if (prop.format === "uri" || prop.format === "url") return "string.url";
    if (prop.pattern != null) return type(new RegExp(prop.pattern));
    const lo = prop.minLength;
    const hi = prop.maxLength;
    if (lo != null && hi != null) return `${lo} <= string <= ${hi}`;
    if (lo != null) return `string >= ${lo}`;
    if (hi != null) return `string <= ${hi}`;
    return "string";
  }

  return "unknown";
}

/** Build an ArkType definition object from a JSON Schema object (recursive). */
export function jsonSchemaToArkDef(schema) {
  const props = schema.properties || {};
  const required = new Set(schema.required || []);
  const def = {};
  for (const [key, prop] of Object.entries(props)) {
    const k = required.has(key) ? key : `${key}?`;
    def[k] = propToArkDef(prop);
  }
  return def;
}

/** Return an ArkType type for any accepted schema (JSON Schema is converted). */
export function toArkType(schema) {
  if (isArkType(schema)) return schema;
  if (isJsonSchema(schema)) return type(jsonSchemaToArkDef(schema));
  throw new TypeError("Unsupported schema: pass an ArkType type or a JSON Schema object.");
}

/* ─────────────────────────── JSON Schema → Form Model ─────────────────── */

const titleCase = (s) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^\w/, (c) => c.toUpperCase());

/** Infer a field `kind` (which widget renders it) from a JSON-Schema property. */
function inferKind(prop) {
  if (Array.isArray(prop.enum) || "const" in prop) return "select";
  if (prop.type === "object" && prop.properties) return "group";
  if (prop.type === "array") return "array";
  if (prop.type === "boolean") return "checkbox";
  if (prop.type === "integer" || prop.type === "number") return "number";
  if (prop.format === "email") return "email";
  if (prop.format === "uri" || prop.format === "url") return "url";
  if ((prop.maxLength ?? 0) > 80) return "textarea";
  return "text";
}

/** Build one field descriptor (recursive for group/array). `path` is the dotted
 *  location (no array indices) used to look up overrides. */
function buildField(name, prop, isRequired, overrides, prefix) {
  const path = name ? (prefix ? prefix + "." + name : name) : prefix;
  const ov = overrides[path] || {};
  const kind = ov.kind || inferKind(prop);
  const field = {
    name,
    kind,
    label: ov.label || titleCase(name || "item"),
    required: ov.required ?? isRequired,
  };
  if ((ov.hint ?? prop.description) != null) field.hint = String(ov.hint ?? prop.description);
  const ph = ov.placeholder ?? (prop.examples && prop.examples[0]);
  if (ph != null) field.placeholder = String(ph);
  if (ov.source) field.source = ov.source; // autocomplete data source (app-supplied)

  if (kind === "group") {
    field.fields = buildFields(prop, overrides, path);
    return field;
  }
  if (kind === "array") {
    field.item = buildField("", prop.items || {}, true, overrides, path);
    if (ov.itemLabel) field.itemLabel = ov.itemLabel;
    return field;
  }

  // scalar
  const enumVals = Array.isArray(prop.enum) ? prop.enum : "const" in prop ? [prop.const] : null;
  const options_ =
    ov.options ||
    (enumVals ? enumVals.map((v) => ({ value: String(v), label: titleCase(String(v)) })) : undefined);
  if (options_) field.options = options_;
  if (prop.minLength != null) field.minLength = prop.minLength;
  if (prop.maxLength != null) field.maxLength = prop.maxLength;
  if (prop.pattern != null) field.pattern = prop.pattern;
  if (prop.minimum != null) field.min = prop.minimum;
  if (prop.maximum != null) field.max = prop.maximum;
  if (kind === "number") field.step = prop.type === "integer" ? 1 : ov.step ?? "any";
  return field;
}

function buildFields(schemaObj, overrides, prefix) {
  const props = schemaObj.properties || {};
  const required = new Set(schemaObj.required || []);
  return Object.keys(props).map((n) => buildField(n, props[n], required.has(n), overrides, prefix));
}

/**
 * Normalise a schema to a Form Model: `{ fields: CrFormField[] }`.
 * `options.overrides[dottedPath]` may set { label, kind, hint, placeholder,
 * options, required, step, source, itemLabel }; `options.order` reorders/filters
 * the TOP-LEVEL fields by name. Nested overrides use the dotted path without array
 * indices (e.g. `address.city`, `members.email`).
 */
export function toFormModel(schema, options = {}) {
  const json = toJsonSchema(schema);
  const overrides = options.overrides || {};
  let fields = buildFields(json, overrides, "");
  if (Array.isArray(options.order) && options.order.length) {
    const byName = new Map(fields.map((f) => [f.name, f]));
    fields = options.order.map((n) => byName.get(n)).filter(Boolean);
  }
  return { fields };
}

/* ─────────────────────────────── validation ───────────────────────────── */

function coerceField(field, v) {
  if (field.kind === "group") {
    const o = coerceObject(field.fields, v && typeof v === "object" ? v : {});
    return Object.keys(o).length ? o : undefined;
  }
  if (field.kind === "array") {
    if (!Array.isArray(v)) return undefined;
    return v.map((item) => coerceField(field.item, item));
  }
  if (field.kind === "checkbox") return v === true || v === "true" || v === "on";
  if (v === "" || v === undefined || v === null) return undefined;
  if (field.kind === "number") {
    const n = Number(v);
    return Number.isNaN(n) ? v : n; // keep bad input so ArkType reports it
  }
  return v;
}

function coerceObject(fields, values) {
  const out = {};
  for (const f of fields) {
    if (f.kind === "checkbox") {
      out[f.name] = coerceField(f, values[f.name]); // always a definite boolean
      continue;
    }
    const c = coerceField(f, values[f.name]);
    if (c !== undefined) out[f.name] = c; // absent → let "required" speak
  }
  return out;
}

/** Coerce raw form values (strings from inputs) to the schema's types (recursive). */
export function coerceValues(values, model) {
  return coerceObject(model.fields, values || {});
}

/** Tidy ArkType's raw message into something a form field can show. */
function tidy(message) {
  return message.replace(/\s*\(was missing\)\s*$/, "").replace(/^(\w)/, (c) => c.toUpperCase());
}

/**
 * Build a validator from any accepted schema. Returns
 * `validate(values) => { valid, errors: { [dottedPath]: message }, data }`.
 * Backed by ArkType; values are coerced by the Form Model first. Error keys carry
 * the full instance path including array indices, e.g. `members.1.email`.
 */
export function createValidator(schema, model) {
  const arkT = toArkType(schema);
  const fm = model || toFormModel(schema);
  return function validate(values) {
    const coerced = coerceValues(values || {}, fm);
    const out = arkT(coerced);
    if (out instanceof type.errors) {
      const errors = {};
      for (const e of out) {
        const key = Array.isArray(e.path) && e.path.length ? e.path.join(".") : "";
        if (key && !(key in errors)) errors[key] = tidy(e.message);
      }
      return { valid: false, errors, data: null };
    }
    return { valid: true, errors: {}, data: out };
  };
}

/**
 * One-call convenience: normalise a schema into everything a UI needs.
 * Returns { model, validate, jsonSchema, arkType }.
 */
export function defineForm(schema, options = {}) {
  const jsonSchema = toJsonSchema(schema);
  const model = toFormModel(schema, options);
  const arkType = toArkType(schema);
  const validate = createValidator(schema, model);
  return { model, validate, jsonSchema, arkType };
}

export { type };
