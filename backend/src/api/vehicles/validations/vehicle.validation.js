import { body } from "express-validator";
import * as r from "../../../shared/rules.js";

// The car fields an add or edit may send (BE-003).
const CAR = ["year", "make", "model", "type", "mileage", "plate", "vin", "color"];

// In the order they are checked, so the first error is the same as before.
// `prefix` names the car fields inside another body, e.g. "vehicle." for the first car of a new customer;
// `when` skips every rule unless it holds for the request (the car is optional there).
const carRules = ({ prefix = "", when } = {}) => {
  const field = (name) => (when ? body(prefix + name).if(when) : body(prefix + name));
  return [
    // BE-021: optional and not unique. Older and imported cars can have shorter or longer chassis numbers.
    r.optionalText(field("vin"), "VIN", 32)
      .custom((vin) => vin === null || /^[A-Z0-9]+$/i.test(vin)).withMessage("VIN can only have letters and numbers")
      .customSanitizer((vin) => (typeof vin === "string" ? vin.toUpperCase() : vin)),
    r.optionalInt(field("year"), "Year", 1900, () => new Date().getFullYear() + 1),
    r.requireText(field("make"), "Make", 50),
    r.requireText(field("model"), "Model", 50),
    r.optionalText(field("type"), "Type", 30),
    r.optionalInt(field("mileage"), "Mileage", 0, 5000000),
    r.requireText(field("plate"), "Plate number", 20).toUpperCase(),
    r.optionalText(field("color"), "Color", 30),
  ];
};

// The checked car fields, in a fixed shape for the service.
const pickCar = (source) => Object.fromEntries(CAR.map((name) => [name, source[name]]));

const createVehicle = [...carRules(), r.requireId(body("customer_id"), "Customer")];
const customerId = [r.idParams("Customer id")];
const vehicleId = [r.idParams("Car id")];
const updateVehicle = [r.idParams("Car id"), ...r.editable(carRules())];

export { CAR, carRules, pickCar, createVehicle, customerId, vehicleId, updateVehicle };
