import { body, param } from "express-validator";
import { ROLES } from "../../../middlewares/auth.js";
import * as r from "../../../shared/rules.js";

// BE-012: no password on an edit. The route refuses one and points to Forgot password.
const PERSON = ["email", "first_name", "last_name", "phone", "role_id", "active"];

const personRules = () => [
  r.requireEmail(),
  r.requireText("first_name", "First name", 100),
  r.requireText("last_name", "Last name", 100),
  r.optionalText("phone", "Phone", 30),
  r.flag("active", "Active"),
  body("role_id")
    .customSanitizer(Number)
    .custom((role) => [ROLES.TECHNICIAN, ROLES.MANAGER, ROLES.ADMIN].includes(role)).withMessage("Choose a role"),
];

const login = [r.requireEmail(), r.requireText("password", "Password", 72)];
const changePassword = [r.requireText("old_password", "Current password", 72), r.requirePassword("new_password")];
const createEmployee = [...personRules(), r.requirePassword()];
const employeeId = [r.requireId("id", "Employee id", param)];
const updateEmployee = [...employeeId, r.somethingToChange(PERSON), ...r.editable(personRules()), r.requireUpdatedAt()];

export { PERSON, login, changePassword, createEmployee, employeeId, updateEmployee };
