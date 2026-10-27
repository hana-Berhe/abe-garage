import { body, param } from "express-validator";
import * as r from "../../../shared/rules.js";

const SERVICE = ["name", "description", "price", "labor_hours", "active"];

const serviceRules = () => [
  body("labor_hours")
    .customSanitizer((value) => (r.isEmpty(value) ? 0 : Number(value)))
    .custom((hours) => Number.isFinite(hours) && hours >= 0 && hours <= 99).withMessage("Hours must be a number from 0 to 99").bail()
    .customSanitizer((hours) => hours.toFixed(2)),
  r.requireText("name", "Service name", 100),
  r.optionalText("description", "Description", 2000),
  r.money("price", "Price"),
  r.flag("active", "Active"),
];

const createService = serviceRules();
const updateService = [r.requireId("id", "Service id", param), r.somethingToChange(SERVICE), ...r.editable(serviceRules()), r.requireUpdatedAt()];

export { SERVICE, createService, updateService };
