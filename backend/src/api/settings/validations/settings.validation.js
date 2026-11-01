import { body } from "express-validator";
import * as r from "../../../shared/rules.js";

const SETTINGS = ["name", "address", "phone", "email", "vat_rate", "opening_time", "closing_time"];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const time = (chain, label, required) =>
  chain
    .customSanitizer(r.emptyToNull)
    .custom((value) => value !== null || !required).withMessage(`${label} is required`)
    .custom((value) => value === null || TIME_RE.test(value)).withMessage(`${label} must look like 08:00`);

// Settings are only ever edited, so every field may be left out. The closing time is checked against the
// opening time in the controller, because one of them may be the saved value.
const updateSettings = r.editable(
  [
    body("vat_rate")
      .custom((value) => value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100)
      .withMessage("VAT rate must be a number from 0 to 100")
      .customSanitizer((value) => Number(value).toFixed(2)),
    time(body("opening_time"), "Opening time", true),
    time(body("closing_time"), "Closing time", false),
    r.requireText(body("name"), "Garage name", 100),
    r.optionalText(body("address"), "Address"),
    r.optionalText(body("phone"), "Phone", 30),
    // The email may be cleared: "" or null is saved as null.
    r.requireEmail(body("email").customSanitizer((value) => value || null).if((value) => value !== null)),
  ],
  { fields: SETTINGS }
);

export { SETTINGS, updateSettings };
