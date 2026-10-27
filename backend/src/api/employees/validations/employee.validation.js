import { ok, created, badField } from "../../../shared/respond.js";
import { ROLES } from "../../../middlewares/auth.js";
import * as v from "../../../shared/validate.js";

function readEmployee(body, { passwordRequired }) {
  const data = {
    email: v.requireEmail(body),
    first_name: v.requireText(body, "first_name", "First name", 100),
    last_name: v.requireText(body, "last_name", "Last name", 100),
    phone: v.optionalText(body, "phone", "Phone", 30),
    role_id: Number(body.role_id),
    active: body.active === undefined ? 1 : v.toFlag(body.active, "active", "Active"),
  };
  if (![ROLES.TECHNICIAN, ROLES.MANAGER, ROLES.ADMIN].includes(data.role_id)) {
    throw badField("role_id", "Choose a role");
  }
  if (passwordRequired) data.password = v.requirePassword(body);
  return data;
}

export { readEmployee };
