import { validationResult } from "express-validator";
import { ApiError } from "../shared/respond.js";

// Runs a feature's express-validator rules, then answers 400 in the app's format (BE-003):
//   { status: "error", message: "Validation failed", data: { errors: { <field>: <message> } } }
// One message per field, in the order the rules are listed, so the form shows the first one under its input.
// A field inside a list is named with dots, e.g. "lines.0.service_id".
function validate(rules) {
  return [...rules, sendErrors];
}

function sendErrors(req, res, next) {
  const found = validationResult(req).array({ onlyFirstError: true });
  if (!found.length) return next();
  const errors = {};
  for (const error of found) {
    const field = error.path.replace(/\[(\d+)\]/g, ".$1");
    if (!(field in errors)) errors[field] = error.msg;
  }
  return next(new ApiError(400, "Validation failed", { errors }));
}

export { validate };
