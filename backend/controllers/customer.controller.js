const customerService = require("../services/customer.service");
const { ok, created } = require("../utils/respond");
const { readPage } = require("../utils/pagination");
const { readUpdatedAt } = require("../utils/staleCheck");
const { readVehicle } = require("./vehicle.controller");
const v = require("../utils/validate");

function readCustomer(body) {
  return {
    first_name: v.requireText(body, "first_name", "First name", 100),
    last_name: v.requireText(body, "last_name", "Last name", 100),
    email: v.requireEmail(body),
    phone: v.requireText(body, "phone", "Phone", 30),
    active: body.active === undefined ? 1 : v.toFlag(body.active, "active", "Active"),
  };
}

async function create(req, res) {
  const customer = readCustomer(req.body);
  const vehicle = req.body.vehicle ? readVehicle(req.body.vehicle, "vehicle.") : null;
  return created(res, "Customer added", await customerService.create(customer, vehicle));
}

async function list(req, res) {
  const page = readPage(req.query);
  const data = await customerService.list({ ...page, activeOnly: req.query.active === "1" });
  return ok(res, "Customers", data);
}

async function getOne(req, res) {
  const id = v.requireId(req.params.id, "id", "Customer id");
  return ok(res, "Customer", await customerService.getProfile(id));
}

async function update(req, res) {
  const id = v.requireId(req.params.id, "id", "Customer id");
  const customer = readCustomer(req.body);
  return ok(res, "Customer saved", await customerService.update(id, customer, readUpdatedAt(req.body)));
}

module.exports = { create, list, getOne, update };
