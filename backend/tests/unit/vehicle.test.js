import test from "node:test";
import assert from "node:assert";
import { readVehicle } from "../../src/api/vehicles/validations/vehicle.validation.js";

const car = { make: "Toyota", model: "Corolla", plate: "aa-12345" };

test("VIN: optional", () => {
  assert.strictEqual(readVehicle(car).vin, null);
  assert.strictEqual(readVehicle({ ...car, vin: "" }).vin, null);
});

test("VIN: short and long chassis numbers up to 32 are accepted and upper-cased", () => {
  assert.strictEqual(readVehicle({ ...car, vin: "ke70123456" }).vin, "KE70123456");
  assert.strictEqual(readVehicle({ ...car, vin: "A".repeat(32) }).vin, "A".repeat(32));
});

test("VIN: more than 32 characters or symbols are refused", () => {
  assert.throws(() => readVehicle({ ...car, vin: "A".repeat(33) }), (e) => e.httpStatus === 400 && e.data.field === "vin");
  assert.throws(() => readVehicle({ ...car, vin: "AB 12-34" }), (e) => e.httpStatus === 400 && e.data.field === "vin");
});
