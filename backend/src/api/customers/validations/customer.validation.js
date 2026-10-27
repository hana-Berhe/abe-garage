import { body, param } from "express-validator";
import * as r from "../../../shared/rules.js";
import { carRules } from "../../vehicles/validations/vehicle.validation.js";

const CUSTOMER = ["first_name", "last_name", "email", "phone", "active"];

const customerRules = () => [
  r.requireText("first_name", "First name", 100),
  r.requireText("last_name", "Last name", 100),
  r.requireEmail(),
  r.requireText("phone", "Phone", 30),
  r.flag("active", "Active"),
];

// The first car may come with the new customer, as { vehicle: { ... } }.
const withCar = (field) => body(field).if((value, { req }) => !!req.body.vehicle);

const createCustomer = [...customerRules(), ...carRules("vehicle.", withCar)];
const customerId = [r.requireId("id", "Customer id", param)];
const updateCustomer = [...customerId, r.somethingToChange(CUSTOMER), ...r.editable(customerRules()), r.requireUpdatedAt()];

export { CUSTOMER, createCustomer, customerId, updateCustomer };
