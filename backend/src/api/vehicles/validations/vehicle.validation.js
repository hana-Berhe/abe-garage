import { z } from "zod";
import * as r from "../../../shared/rules.js";

// The car fields an add or edit may send (BE-003).
const CAR = ["year", "make", "model", "type", "mileage", "plate", "vin", "color"];

// In the order they are checked, so the first error is the same as before.
const carShape = () => ({
  // BE-021: optional and not unique. Older and imported cars can have shorter or longer chassis numbers.
  vin: r.optionalText("VIN", 32)
    .refine((vin) => vin === null || /^[A-Z0-9]+$/i.test(vin), "VIN can only have letters and numbers")
    .transform((vin) => vin && vin.toUpperCase()),
  year: r.optionalInt("Year", 1900, () => new Date().getFullYear() + 1),
  make: r.requireText("Make", 50),
  model: r.requireText("Model", 50),
  type: r.optionalText("Type", 30),
  mileage: r.optionalInt("Mileage", 0, 5000000),
  plate: r.requireText("Plate number", 20).toUpperCase(),
  color: r.optionalText("Color", 30),
});

const carSchema = z.object(carShape());

// The checked car fields, in a fixed shape for the service.
const pickCar = (source) => Object.fromEntries(CAR.map((name) => [name, source[name]]));

const createVehicle = { body: z.object({ ...carShape(), customer_id: r.requireId("Customer") }) };
const customerId = { params: r.idParams("Customer id") };
const vehicleId = { params: r.idParams("Car id") };
const updateVehicle = { params: r.idParams("Car id"), body: r.editable(carShape()) };

export { CAR, carShape, carSchema, pickCar, createVehicle, customerId, vehicleId, updateVehicle };
