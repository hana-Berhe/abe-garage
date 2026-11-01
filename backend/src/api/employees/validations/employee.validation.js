import { body } from "express-validator";
import { ROLES } from "../../../middlewares/auth.js";
import * as r from "../../../shared/rules.js";

// BE-012: no password on an edit. The route refuses one and points to Forgot password.
const PERSON = ["email", "first_name", "last_name", "phone", "role_id", "active"];

// In the order they are checked, so the first error is the same as before.
const personShape = () => [
  r.requireEmail(body("email")),
  r.requireText(body("first_name"), "First name", 100),
  r.requireText(body("last_name"), "Last name", 100),
  r.optionalText(body("phone"), "Phone", 30),
  r.flag(body("active"), "Active"),
  body("role_id")
    .customSanitizer(Number)
    .custom((role) => [ROLES.TECHNICIAN, ROLES.MANAGER, ROLES.ADMIN].includes(role)).withMessage("Choose a role"),
];

const login = [r.requireEmail(body("email")), r.requireText(body("password"), "Password", 72)];
const changePassword = [r.requireText(body("old_password"), "Current password", 72), r.requirePassword(body("new_password"))];
const createEmployee = [...personShape(), r.requirePassword(body("password"))];
const employeeId = [r.idParams("Employee id")];
const updateEmployee = [r.idParams("Employee id"), ...r.editable(personShape())];

export { PERSON, login, changePassword, createEmployee, employeeId, updateEmployee };
