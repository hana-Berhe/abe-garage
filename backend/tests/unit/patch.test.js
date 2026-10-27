import test from "node:test";
import assert from "node:assert";
import { mergePatch } from "../../src/shared/patch.js";

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

test("PATCH: nothing editable sent is a 400", () => {
  assert.throws(() => mergePatch(saved, { updated_at: "x" }, FIELDS), (e) => e.httpStatus === 400 && e.data.field === "first_name");
});
