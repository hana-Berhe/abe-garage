import * as employeeService from "../service/employee.service.js";
import { ok, created } from "../../../shared/respond.js";
import { readPage } from "../../../shared/pagination.js";
import { ROLES } from "../../../middlewares/auth.js";
import { mergePatch } from "../../../shared/patch.js";
import { PERSON } from "../validations/employee.validation.js";

// The routes check every field first (validations/employee.validation.js).

async function login(req, res) {
  const data = await employeeService.login(req.body.email, req.body.password);
  return ok(res, "Logged in", data);
}

async function changePassword(req, res) {
  await employeeService.changePassword(req.employee.id, req.body.old_password, req.body.new_password);
  return ok(res, "Password changed. Please log in again.");
}

async function profile(req, res) {
  return ok(res, "Get own staff profile successful", await employeeService.getProfile(req.employee.id));
}

async function create(req, res) {
  const data = { ...Object.fromEntries(PERSON.map((name) => [name, req.body[name]])), password: req.body.password };
  const employee = await employeeService.create(data);
  return created(res, "Employee added", employee);
}

async function list(req, res) {
  const page = readPage(req.query);
  let roleId = req.query.role ? Number(req.query.role) : null;
  let activeOnly = req.query.active === "1";
  // A manager may only list active technicians, to assign jobs.
  if (req.employee.role !== ROLES.ADMIN) {
    roleId = ROLES.TECHNICIAN;
    activeOnly = true;
  }
  const data = await employeeService.list({ ...page, roleId, activeOnly });
  return ok(res, "Employees", data);
}

async function getOne(req, res) {
  return ok(res, "Employee", await employeeService.getById(req.params.id));
}

async function update(req, res) {
  const id = req.params.id;
  const data = mergePatch(await employeeService.getById(id), req.body, PERSON);
  data.updated_at = req.body.updated_at;
  const employee = await employeeService.update(id, data, req.employee.id);
  return ok(res, "Employee saved", employee);
}

export { login, changePassword, profile, create, list, getOne, update };
