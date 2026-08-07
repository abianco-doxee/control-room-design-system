// Unit tests for the headless form core (node:test). Run: npm run test:forms
import { test } from "node:test";
import assert from "node:assert/strict";
import { type } from "arktype";
import {
  defineForm,
  toJsonSchema,
  toFormModel,
  toArkType,
  createValidator,
  jsonSchemaToArkDef,
} from "../lib/forms/index.js";

// A representative "new session" schema authored in ArkType.
const ArkSchema = type({
  name: "string >= 2",
  email: "string.email",
  replicas: "number.integer >= 1",
  region: "'eu-west' | 'us-east' | 'ap-south'",
  "notes?": "string <= 140",
  autoscale: "boolean",
});

// The equivalent authored as JSON Schema (portable / backend-owned).
const JsonSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 2 },
    email: { type: "string", format: "email" },
    replicas: { type: "integer", minimum: 1 },
    region: { enum: ["eu-west", "us-east", "ap-south"] },
    notes: { type: "string", maxLength: 140 },
    autoscale: { type: "boolean" },
  },
  required: ["name", "email", "replicas", "region", "autoscale"],
};

test("ArkType → JSON Schema export", () => {
  const js = toJsonSchema(ArkSchema);
  assert.equal(js.type, "object");
  assert.equal(js.properties.name.minLength, 2);
  assert.equal(js.properties.email.format, "email");
  assert.ok(js.required.includes("name"));
  assert.ok(!js.required.includes("notes"));
});

test("JSON Schema → ArkType definition + validation", () => {
  const def = jsonSchemaToArkDef(JsonSchema);
  assert.equal(def.name, "string >= 2");
  assert.equal(def.email, "string.email");
  assert.equal(def["notes?"], "string <= 140"); // optional key gets ?
  const arkT = toArkType(JsonSchema);
  assert.ok(arkT({ name: "Ada", email: "a@b.co", replicas: 2, region: "eu-west", autoscale: true }) instanceof type.errors === false);
});

test("Form Model inference (both directions agree)", () => {
  const fromArk = toFormModel(ArkSchema).fields;
  const fromJson = toFormModel(JsonSchema).fields;
  const kinds = (fs) => Object.fromEntries(fs.map((f) => [f.name, f.kind]));
  const ka = kinds(fromArk);
  const kj = kinds(fromJson);
  assert.equal(ka.email, "email");
  assert.equal(ka.replicas, "number");
  assert.equal(ka.region, "select");
  assert.equal(ka.autoscale, "checkbox");
  assert.deepEqual(ka, kj, "kind inference matches across schema sources");
  // Options: the JSON-Schema path preserves authored order; the ArkType path
  // alphabetises (ArkType's .toJsonSchema() sorts enum members). Compare as sets.
  const arkRegion = fromArk.find((f) => f.name === "region").options.map((o) => o.value);
  const jsonRegion = fromJson.find((f) => f.name === "region").options.map((o) => o.value);
  assert.deepEqual(jsonRegion, ["eu-west", "us-east", "ap-south"], "JSON path keeps authored order");
  assert.deepEqual([...arkRegion].sort(), [...jsonRegion].sort(), "same option set both ways");
  const notes = fromArk.find((f) => f.name === "notes");
  assert.equal(notes.required, false);
});

test("validate: coercion + per-field errors + valid path", () => {
  const { validate } = defineForm(ArkSchema);
  // strings from inputs; replicas as a string should coerce to number
  const bad = validate({ name: "a", email: "nope", replicas: "0", region: "boss", autoscale: "true" });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.name, "name error present");
  assert.ok(bad.errors.email, "email error present");
  assert.ok(bad.errors.replicas, "replicas error present");
  assert.ok(bad.errors.region, "region error present");
  assert.equal(bad.errors.notes, undefined, "optional untouched field has no error");

  const ok = validate({ name: "Ada", email: "a@b.co", replicas: "3", region: "eu-west", autoscale: "on" });
  assert.equal(ok.valid, true);
  assert.equal(ok.data.replicas, 3, "replicas coerced to number");
  assert.equal(ok.data.autoscale, true, "checkbox coerced to boolean");
});

test("an unchecked required checkbox is a valid false, not 'missing'", () => {
  const { validate } = defineForm(ArkSchema);
  const r = validate({ name: "Ada", email: "a@b.co", replicas: "1", region: "eu-west" }); // autoscale never touched
  assert.equal(r.valid, true, "unchecked required boolean validates as false");
  assert.equal(r.data.autoscale, false);
});

test("required empty field reports an error (not silently valid)", () => {
  const { validate } = defineForm(JsonSchema);
  const r = validate({ name: "", email: "", replicas: "", region: "", autoscale: "" });
  assert.equal(r.valid, false);
  assert.ok(r.errors.name);
  assert.ok(r.errors.email);
});

test("roundtrip: ArkType → JSON Schema → ArkType still validates", () => {
  const js = toJsonSchema(ArkSchema);
  const back = toArkType(js);
  assert.ok(back({ name: "Ada", email: "a@b.co", replicas: 2, region: "us-east", autoscale: false }) instanceof type.errors === false);
  assert.ok(back({ name: "x", email: "a@b.co", replicas: 2, region: "us-east", autoscale: false }) instanceof type.errors);
});
