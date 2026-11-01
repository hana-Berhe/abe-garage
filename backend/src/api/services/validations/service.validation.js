import { body } from "express-validator";
import * as r from "../../../shared/rules.js";

const SERVICE = ["name", "description", "price", "labor_hours", "active"];

const serviceShape = () => [
  body("labor_hours")
    .customSanitizer((value) => (r.isEmpty(value) ? 0 : Number(value)))
    .custom((hours) => Number.isFinite(hours) && hours >= 0 && hours <= 99).withMessage("Hours must be a number from 0 to 99")
    .customSanitizer((hours) => hours.toFixed(2)),
  r.requireText(body("name"), "Service name", 100),
  r.optionalText(body("description"), "Description", 2000),
  r.money(body("price"), "Price"),
  r.flag(body("active"), "Active"),
];

const createService = serviceShape();
const updateService = [r.idParams("Service id"), ...r.editable(serviceShape(), { fields: SERVICE })];

export { SERVICE, createService, updateService };
