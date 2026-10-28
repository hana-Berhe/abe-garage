import { z } from "zod";
import { ROLES } from "../../../middlewares/auth.js";
import * as r from "../../../shared/rules.js";

// BE-012: no password on an edit. The route refuses one and points to Forgot password.
const PERSON = ["email", "first_name", "last_name", "phone", "role_id", "active"];

// In the order they are checked, so the first error is the same as before.
const personShape = () => ({
  email: r.requireEmail(),
  first_name: r.requireText("First name", 100),
  last_name: r.requireText("Last name", 100),
  phone: r.optionalText("Phone", 30),
  active: r.flag("Active"),
  role_id: z.any().transform(Number).refine((role) => [ROLES.TECHNICIAN, ROLES.MANAGER, ROLES.ADMIN].includes(role), "Choose a role"),
});

const login = { body: z.object({ email: r.requireEmail(), password: r.requireText("Password", 72) }) };
const changePassword = { body: z.object({ old_password: r.requireText("Current password", 72), new_password: r.requirePassword() }) };
const createEmployee = { body: z.object({ ...personShape(), password: r.requirePassword() }) };
const employeeId = { params: r.idParams("Employee id") };
const updateEmployee = { params: r.idParams("Employee id"), body: r.editable(personShape()) };

export { PERSON, login, changePassword, createEmployee, employeeId, updateEmployee };
