import test from "node:test";
import assert from "node:assert";
import { validationResult } from "express-validator";
import { carRules } from "../../src/api/vehicles/validations/vehicle.validation.js";

const car = { make: "Toyota", model: "Corolla", plate: "aa-12345" };

// Runs the car rules on a body and returns the cleaned body and the fields with an error.
async function check(body) {
  const req = { body: { ...body } };
  for (const rule of carRules()) await rule.run(req);
  return { body: req.body, fields: validationResult(req).array().map((e) => e.path) };
}

test("VIN: optional", async () => {
  assert.strictEqual((await check(car)).body.vin, null);
  assert.strictEqual((await check({ ...car, vin: "" })).body.vin, null);
});

test("VIN: short and long chassis numbers up to 32 are accepted and upper-cased", async () => {
  assert.strictEqual((await check({ ...car, vin: "ke70123456" })).body.vin, "KE70123456");
  assert.strictEqual((await check({ ...car, vin: "A".repeat(32) })).body.vin, "A".repeat(32));
});

test("VIN: more than 32 characters or symbols are refused", async () => {
  assert.deepStrictEqual((await check({ ...car, vin: "A".repeat(33) })).fields, ["vin"]);
  assert.deepStrictEqual((await check({ ...car, vin: "AB 12-34" })).fields, ["vin"]);
});

test("plate is upper-cased and the optional fields are null", async () => {
  const { body, fields } = await check(car);
  assert.deepStrictEqual(fields, []);
  assert.deepStrictEqual(body, { ...car, plate: "AA-12345", vin: null, year: null, type: null, mileage: null, color: null });
});
