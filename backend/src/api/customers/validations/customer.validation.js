import { body } from "express-validator";
import * as r from "../../../shared/rules.js";
import { carRules } from "../../vehicles/validations/vehicle.validation.js";

const CUSTOMER = ["first_name", "last_name", "email", "phone", "active"];

const customerShape = () => [
  r.requireText(body("first_name"), "First name", 100),
  r.requireText(body("last_name"), "Last name", 100),
  r.requireEmail(body("email")),
  r.requireText(body("phone"), "Phone", 30),
  r.flag(body("active"), "Active"),
];

// The first car may come with the new customer, as { vehicle: { ... } }. Its errors are named "vehicle.plate" and so on.
// Nothing (or null, "" or false) means no car; anything else that isn't an object is checked as an empty car.
const firstCar = [
  body("vehicle").customSanitizer((value) => (!value ? undefined : r.isObject(value) ? value : {})),
  ...carRules({ prefix: "vehicle.", when: (value, { req }) => req.body.vehicle !== undefined }),
];

const createCustomer = [...customerShape(), ...firstCar];
const customerId = [r.idParams("Customer id")];
const updateCustomer = [r.idParams("Customer id"), ...r.editable(customerShape())];

export { CUSTOMER, createCustomer, customerId, updateCustomer };
