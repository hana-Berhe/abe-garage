import { body, param } from "express-validator";
import * as r from "../../../shared/rules.js";

// The car fields an add or edit may send (BE-003).
const CAR = ["year", "make", "model", "type", "mileage", "plate", "vin", "color"];

// prefix lets the customer form report "vehicle.plate" when the car is sent with a new customer.
function carRules(prefix = "", at = body) {
  const f = (name) => prefix + name;
  return [
    // BE-021: optional and not unique. Older and imported cars can have shorter or longer chassis numbers.
    r.optionalText(f("vin"), "VIN", 32, at).bail()
      .custom((value) => value === null || /^[A-Z0-9]+$/i.test(value)).withMessage("VIN can only have letters and numbers").bail()
      .customSanitizer((value) => value && value.toUpperCase()),
    r.optionalInt(f("year"), "Year", 1900, () => new Date().getFullYear() + 1, at),
    r.requireText(f("make"), "Make", 50, at),
    r.requireText(f("model"), "Model", 50, at),
    r.optionalText(f("type"), "Type", 30, at),
    r.optionalInt(f("mileage"), "Mileage", 0, 5000000, at),
    r.requireText(f("plate"), "Plate number", 20, at).bail().customSanitizer((value) => value.toUpperCase()),
    r.optionalText(f("color"), "Color", 30, at),
  ];
}

// The checked car fields, in a fixed shape for the service.
const pickCar = (source) => Object.fromEntries(CAR.map((name) => [name, source[name]]));

const createVehicle = [...carRules(), r.requireId("customer_id", "Customer")];
const customerId = [r.requireId("id", "Customer id", param)];
const vehicleId = [r.requireId("id", "Car id", param)];
const updateVehicle = [...vehicleId, r.somethingToChange(CAR), ...r.editable(carRules()), r.requireUpdatedAt()];

export { CAR, carRules, pickCar, createVehicle, customerId, vehicleId, updateVehicle };
