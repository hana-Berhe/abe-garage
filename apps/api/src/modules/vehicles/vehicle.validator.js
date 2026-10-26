const { ok, created, badField } = require("../../shared/respond");
const v = require("../../shared/validate");

function optionalInt(body, field, label, min, max, prefix) {
  if (body[field] === undefined || body[field] === null || body[field] === "") return null;
  const n = Number(body[field]);
  if (!Number.isInteger(n) || n < min || n > max) throw badField(prefix + field, `${label} must be a whole number from ${min} to ${max}`);
  return n;
}

// prefix lets the customer form report "vehicle.plate" when the car is sent with a new customer.
function readVehicle(body, prefix = "") {
  const field = (name, label, max, required) => {
    try {
      return required ? v.requireText(body, name, label, max) : v.optionalText(body, name, label, max);
    } catch (err) {
      err.data.field = prefix + name;
      throw err;
    }
  };
  const vin = field("vin", "VIN", 17, false);
  if (vin && !/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) throw badField(prefix + "vin", "VIN must be 17 letters and numbers");
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

module.exports = { optionalInt, readVehicle };
