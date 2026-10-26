const employeeService = require("./employee.service");
const { ok, created, badField } = require("../../shared/respond");
const { readPage } = require("../../shared/pagination");
const { ROLES } = require("../../middlewares/auth");
const v = require("../../shared/validate");
const { readEmployee } = require("./employee.validator");

async function login(req, res) {
  const email = v.requireEmail(req.body);
  const password = v.requireText(req.body, "password", "Password", 72);
  const data = await employeeService.login(email, password);
  return ok(res, "Logged in", data);
}

async function changePassword(req, res) {
  const oldPassword = v.requireText(req.body, "old_password", "Current password", 72);
  const newPassword = v.requirePassword(req.body, "new_password");
  await employeeService.changePassword(req.employee.id, oldPassword, newPassword);
  return ok(res, "Password changed");
}

async function create(req, res) {
  const data = readEmployee(req.body, { passwordRequired: true });
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
  const id = v.requireId(req.params.id, "id", "Employee id");
  return ok(res, "Employee", await employeeService.getById(id));
}

async function update(req, res) {
  const id = v.requireId(req.params.id, "id", "Employee id");
  const data = readEmployee(req.body, { passwordRequired: false });
  if (!req.body.updated_at || Number.isNaN(Date.parse(req.body.updated_at))) {
    throw badField("updated_at", "updated_at from the loaded record is required");
  }
  data.updated_at = req.body.updated_at;
  const employee = await employeeService.update(id, data, req.employee.id);
  return ok(res, "Employee saved", employee);
}

module.exports = { login, changePassword, create, list, getOne, update };
