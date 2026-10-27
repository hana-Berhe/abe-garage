const test = require("node:test");
const assert = require("node:assert");
const { readCallback } = require("../../src/modules/callbacks/callback.validator");

test("call-back form: a filled form is read, 'Not sure' means no service", () => {
  const data = readCallback({ full_name: " Hanna Girma ", phone: "+251 911 000 233", car: "2016 Toyota Vitz", service_id: "", problem: "Squeaks", best_time: "morning" });
  assert.deepStrictEqual(data, { full_name: "Hanna Girma", phone: "+251 911 000 233", car: "2016 Toyota Vitz", service_id: null, problem: "Squeaks", best_time: "morning" });
});

test("call-back form: name and a real phone number are required", () => {
  assert.throws(() => readCallback({ phone: "0911000233" }), (e) => e.data.field === "full_name");
  assert.throws(() => readCallback({ full_name: "A", phone: "call me" }), (e) => e.data.field === "phone");
  assert.throws(() => readCallback({ full_name: "A", phone: "0911000233", best_time: "midnight" }), (e) => e.data.field === "best_time");
});
