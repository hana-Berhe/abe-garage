import test from "node:test";
import assert from "node:assert";
import { body } from "express-validator";
import { mergePatch } from "../../src/shared/patch.js";
import { editable } from "../../src/shared/rules.js";
import { check } from "../../src/middlewares/validate.js";

const saved = { first_name: "Sara", last_name: "Bekele", phone: "0911000058", active: 1 };
const FIELDS = ["first_name", "last_name", "phone", "active"];

test("PATCH: fields left out keep their saved value", () => {
  assert.deepStrictEqual(mergePatch(saved, { phone: "0912000000" }, FIELDS), { ...saved, phone: "0912000000" });
});

test("PATCH: a field sent as null or empty is kept as sent, so it can be cleared", () => {
  assert.strictEqual(mergePatch(saved, { phone: null }, FIELDS).phone, null);
  assert.strictEqual(mergePatch(saved, { phone: "" }, FIELDS).phone, "");
});

test("PATCH: fields outside the editable list are ignored", () => {
  assert.deepStrictEqual(mergePatch(saved, { active: 0, customer_id: 99, updated_at: "x" }, FIELDS), { ...saved, active: 0 });
});

test("PATCH: nothing editable sent is an error on the first editable field", async () => {
  const rules = () => editable(FIELDS.map((f) => body(f)));
  const fields = async (reqBody) => Object.keys(await check(rules(), { body: reqBody }));
  assert.deepStrictEqual(await fields({ updated_at: "2026-01-01T00:00:00Z" }), ["first_name"]);
  assert.deepStrictEqual(await fields({ phone: "0912000000", updated_at: "2026-01-01T00:00:00Z" }), []);
  assert.deepStrictEqual(await fields({ phone: "0912000000" }), ["updated_at"]);
});
