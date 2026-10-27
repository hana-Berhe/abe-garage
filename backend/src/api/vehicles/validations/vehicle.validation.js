import { ok, created, badField } from "../../../shared/respond.js";
import * as v from "../../../shared/validate.js";

function optionalInt(body, field, label, min, max, prefix) {
  if (body[field] === undefined || body[field] === null || body[field] === "") return null;
  const n = Number(body[field]);
  if (!Number.isInteger(n) || n < min || n > max) throw badField(prefix + field, `${label} must be a whole number from ${min} to ${max}`);
  return n;
}

// prefix lets the customer form report "vehicle.plate" when the car is sent with a new customer.
// The car fields an add or edit may send (BE-003).
const CAR = ["year", "make", "model", "type", "mileage", "plate", "vin", "color"];

function readVehicle(body, prefix = "") {
  const field = (name, label, max, required) => {
    try {
      return required ? v.requireText(body, name, label, max) : v.optionalText(body, name, label, max);
    } catch (err) {
      err.data.field = prefix + name;
      throw err;
    }
  };
  // BE-021: optional and not unique. Older and imported cars can have shorter or longer chassis numbers.
  const vin = field("vin", "VIN", 32, false);
  if (vin && !/^[A-Z0-9]+$/i.test(vin)) throw badField(prefix + "vin", "VIN can only have letters and numbers");
  return {
    year: optionalInt(body, "year", "Year", 1900, new Date().getFullYear() + 1, prefix),
    make: field("make", "Make", 50, true),
    model: field("model", "Model", 50, true),
    type: field("type", "Type", 30, false),
    mileage: optionalInt(body, "mileage", "Mileage", 0, 5000000, prefix),
    plate: field("plate", "Plate number", 20, true).toUpperCase(),
    vin: vin ? vin.toUpperCase() : null,
    color: field("color", "Color", 30, false),
  };
}

export { CAR, optionalInt, readVehicle };
