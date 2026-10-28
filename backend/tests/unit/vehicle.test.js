import test from "node:test";
import assert from "node:assert";
import { carSchema } from "../../src/api/vehicles/validations/vehicle.validation.js";

const car = { make: "Toyota", model: "Corolla", plate: "aa-12345" };

// The cleaned car, or the fields with an error.
function check(body) {
  const result = carSchema.safeParse(body);
  return result.success ? { car: result.data, fields: [] } : { fields: result.error.issues.map((i) => i.path.join(".")) };
}

test("VIN: optional", () => {
  assert.strictEqual(check(car).car.vin, null);
  assert.strictEqual(check({ ...car, vin: "" }).car.vin, null);
});

test("VIN: short and long chassis numbers up to 32 are accepted and upper-cased", () => {
  assert.strictEqual(check({ ...car, vin: "ke70123456" }).car.vin, "KE70123456");
  assert.strictEqual(check({ ...car, vin: "A".repeat(32) }).car.vin, "A".repeat(32));
});

test("VIN: more than 32 characters or symbols are refused", () => {
  assert.deepStrictEqual(check({ ...car, vin: "A".repeat(33) }).fields, ["vin"]);
  assert.deepStrictEqual(check({ ...car, vin: "AB 12-34" }).fields, ["vin"]);
});

test("plate is upper-cased and the optional fields are null", () => {
  assert.deepStrictEqual(check(car).car, { ...car, plate: "AA-12345", vin: null, year: null, type: null, mileage: null, color: null });
});
