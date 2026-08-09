// Unit tests for the headless form core (node:test). Run: npm run test:forms

import assert from "node:assert/strict";
import { test } from "node:test";
import { type } from "arktype";
import {
  createValidator,
  defineForm,
  jsonSchemaToArkDef,
  toArkType,
  toFormModel,
  toJsonSchema,
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
  assert.ok(
    arkT({
      name: "Ada",
      email: "a@b.co",
      replicas: 2,
      region: "eu-west",
      autoscale: true,
    }) instanceof
      type.errors ===
      false
  );
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
  assert.deepEqual(
    jsonRegion,
    ["eu-west", "us-east", "ap-south"],
    "JSON path keeps authored order"
  );
  assert.deepEqual([...arkRegion].sort(), [...jsonRegion].sort(), "same option set both ways");
  const notes = fromArk.find((f) => f.name === "notes");
  assert.equal(notes.required, false);
});

test("validate: coercion + per-field errors + valid path", () => {
  const { validate } = defineForm(ArkSchema);
  // strings from inputs; replicas as a string should coerce to number
  const bad = validate({
    name: "a",
    email: "nope",
    replicas: "0",
    region: "boss",
    autoscale: "true",
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.name, "name error present");
  assert.ok(bad.errors.email, "email error present");
  assert.ok(bad.errors.replicas, "replicas error present");
  assert.ok(bad.errors.region, "region error present");
  assert.equal(bad.errors.notes, undefined, "optional untouched field has no error");

  const ok = validate({
    name: "Ada",
    email: "a@b.co",
    replicas: "3",
    region: "eu-west",
    autoscale: "on",
  });
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

test("nested objects + arrays: model shape, dotted error paths, coercion", () => {
  const Nested = type({
    name: "string >= 2",
    address: { city: "string >= 1", zip: "string" },
    tags: "string[]",
    members: type({ email: "string.email", admin: "boolean" }).array(),
  });
  const { model, validate } = defineForm(Nested);

  // model: group + array kinds with nested descriptors
  const byName = Object.fromEntries(model.fields.map((f) => [f.name, f]));
  assert.equal(byName.address.kind, "group");
  assert.equal(byName.address.fields.find((f) => f.name === "city").kind, "text");
  assert.equal(byName.tags.kind, "array");
  assert.equal(byName.tags.item.kind, "text");
  assert.equal(byName.members.kind, "array");
  assert.equal(byName.members.item.kind, "group");
  assert.equal(byName.members.item.fields.find((f) => f.name === "admin").kind, "checkbox");

  // dotted error paths (with array index) + nested coercion (member.admin → bool)
  const bad = validate({
    name: "Ada",
    address: { city: "", zip: "1" },
    tags: ["ok"],
    members: [
      { email: "a@b.co", admin: "on" },
      { email: "nope", admin: "" },
    ],
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors["address.city"], "nested object error keyed by dotted path");
  assert.ok(bad.errors["members.1.email"], "array item error keyed with index");
  assert.equal(bad.errors["members.0.email"], undefined, "valid item has no error");

  const ok = validate({
    name: "Ada",
    address: { city: "Berlin", zip: "10115" },
    tags: ["a", "b"],
    members: [{ email: "a@b.co", admin: "on" }],
  });
  assert.equal(ok.valid, true);
  assert.equal(ok.data.members[0].admin, true, "nested checkbox coerced to boolean");
  assert.deepEqual(ok.data.tags, ["a", "b"]);
});

test("nested overrides + source passthrough via dotted paths", () => {
  const S = type({ address: { city: "string" }, region: "'eu' | 'us'" });
  const src = async () => [];
  const { model } = defineForm(S, {
    overrides: {
      "address.city": { label: "Town", hint: "municipality" },
      region: { kind: "autocomplete", source: src },
    },
  });
  const city = model.fields.find((f) => f.name === "address").fields[0];
  assert.equal(city.label, "Town");
  assert.equal(city.hint, "municipality");
  const region = model.fields.find((f) => f.name === "region");
  assert.equal(region.kind, "autocomplete");
  assert.equal(region.source, src);
});

test("conditional `when` predicate passes through to the model", () => {
  const S = type({ notify: "boolean", "contact?": "string.email" });
  const when = (v) => v.notify === true;
  const { model } = defineForm(S, { overrides: { contact: { when } } });
  assert.equal(model.fields.find((f) => f.name === "contact").when, when);
});

test("composition: $ref into $defs (model group + validation)", () => {
  const schema = {
    type: "object",
    $defs: {
      Address: {
        type: "object",
        properties: { city: { type: "string", minLength: 1 }, zip: { type: "string" } },
        required: ["city"],
      },
    },
    properties: {
      name: { type: "string", minLength: 2 },
      billing: { $ref: "#/$defs/Address" },
    },
    required: ["name", "billing"],
  };
  const { model, validate } = defineForm(schema);
  const billing = model.fields.find((f) => f.name === "billing");
  assert.equal(billing.kind, "group", "$ref to an object schema becomes a group");
  assert.equal(billing.fields.find((f) => f.name === "city").kind, "text");

  const bad = validate({ name: "Ada", billing: { city: "", zip: "1" } });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors["billing.city"], "nested error keyed through the $ref");

  const ok = validate({ name: "Ada", billing: { city: "Berlin", zip: "10115" } });
  assert.equal(ok.valid, true);
});

test("composition: allOf merges properties + required (extend a base)", () => {
  const schema = {
    $defs: {
      Timestamped: {
        type: "object",
        properties: { createdAt: { type: "string" } },
        required: ["createdAt"],
      },
    },
    allOf: [
      { $ref: "#/$defs/Timestamped" },
      {
        type: "object",
        properties: { name: { type: "string", minLength: 2 } },
        required: ["name"],
      },
    ],
  };
  const { model, validate } = defineForm(schema);
  const names = model.fields.map((f) => f.name).sort();
  assert.deepEqual(names, ["createdAt", "name"], "allOf branches merge into one field set");
  assert.equal(model.fields.find((f) => f.name === "name").required, true);
  assert.equal(model.fields.find((f) => f.name === "createdAt").required, true);

  assert.equal(
    validate({ name: "x", createdAt: "t" }).valid,
    false,
    "min-length from one branch enforced"
  );
  assert.equal(validate({ name: "Ada" }).valid, false, "required from the other branch enforced");
  assert.equal(validate({ name: "Ada", createdAt: "2020" }).valid, true);
});

test("composition: anyOf builds a validating union", () => {
  const schema = {
    type: "object",
    properties: {
      id: {
        anyOf: [
          { type: "string", minLength: 1 },
          { type: "integer", minimum: 1 },
        ],
      },
    },
    required: ["id"],
  };
  const { validate } = defineForm(schema);
  assert.equal(validate({ id: "abc" }).valid, true, "string branch accepted");
  assert.equal(validate({ id: "7" }).valid, true, "a non-empty value satisfies the union");
  assert.equal(validate({ id: "" }).valid, false, "empty required union value rejected");
});

test("roundtrip: ArkType → JSON Schema → ArkType still validates", () => {
  const js = toJsonSchema(ArkSchema);
  const back = toArkType(js);
  assert.ok(
    back({
      name: "Ada",
      email: "a@b.co",
      replicas: 2,
      region: "us-east",
      autoscale: false,
    }) instanceof
      type.errors ===
      false
  );
  assert.ok(
    back({
      name: "x",
      email: "a@b.co",
      replicas: 2,
      region: "us-east",
      autoscale: false,
    }) instanceof type.errors
  );
});
