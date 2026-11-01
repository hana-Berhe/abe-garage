import test from "node:test";
import assert from "node:assert";
import { carRules, pickCar } from "../../src/api/vehicles/validations/vehicle.validation.js";
import { check } from "../../src/middlewares/validate.js";

const car = { make: "Toyota", model: "Corolla", plate: "aa-12345" };

// The cleaned car, or the fields with an error.
async function checkCar(body) {
  const req = { body: { ...body } };
  const errors = await check(carRules(), req);
  const fields = Object.keys(errors);
  return fields.length ? { fields } : { car: pickCar(req.body), fields };
}

test("VIN: optional", async () => {
  assert.strictEqual((await checkCar(car)).car.vin, null);
  assert.strictEqual((await checkCar({ ...car, vin: "" })).car.vin, null);
});

test("VIN: short and long chassis numbers up to 32 are accepted and upper-cased", async () => {
  assert.strictEqual((await checkCar({ ...car, vin: "ke70123456" })).car.vin, "KE70123456");
  assert.strictEqual((await checkCar({ ...car, vin: "A".repeat(32) })).car.vin, "A".repeat(32));
});

test("VIN: more than 32 characters or symbols are refused", async () => {
  assert.deepStrictEqual((await checkCar({ ...car, vin: "A".repeat(33) })).fields, ["vin"]);
  assert.deepStrictEqual((await checkCar({ ...car, vin: "AB 12-34" })).fields, ["vin"]);
});

test("plate is upper-cased and the optional fields are null", async () => {
  assert.deepStrictEqual((await checkCar(car)).car, { ...car, plate: "AA-12345", vin: null, year: null, type: null, mileage: null, color: null });
});
