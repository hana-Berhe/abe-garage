import * as v from "../../../shared/validate.js";

function readCustomer(body) {
  return {
    first_name: v.requireText(body, "first_name", "First name", 100),
    last_name: v.requireText(body, "last_name", "Last name", 100),
    email: v.requireEmail(body),
    phone: v.requireText(body, "phone", "Phone", 30),
    active: body.active === undefined ? 1 : v.toFlag(body.active, "active", "Active"),
  };
}

export { readCustomer };
