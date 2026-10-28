import { z } from "zod";
import * as r from "../../../shared/rules.js";
import { carSchema } from "../../vehicles/validations/vehicle.validation.js";

const CUSTOMER = ["first_name", "last_name", "email", "phone", "active"];

const customerShape = () => ({
  first_name: r.requireText("First name", 100),
  last_name: r.requireText("Last name", 100),
  email: r.requireEmail(),
  phone: r.requireText("Phone", 30),
  active: r.flag("Active"),
});

// The first car may come with the new customer, as { vehicle: { ... } }. Its errors are named "vehicle.plate" and so on.
const firstCar = z.preprocess(
  (value) => (!value ? undefined : typeof value === "object" && !Array.isArray(value) ? value : {}),
  carSchema.optional()
);

const createCustomer = { body: z.object({ ...customerShape(), vehicle: firstCar }) };
const customerId = { params: r.idParams("Customer id") };
const updateCustomer = { params: r.idParams("Customer id"), body: r.editable(customerShape()) };

export { CUSTOMER, createCustomer, customerId, updateCustomer };
