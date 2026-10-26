const customerService = require("./customer.service");
const { ok, created } = require("../../shared/respond");
const { readPage } = require("../../shared/pagination");
const { readUpdatedAt } = require("../../shared/stale-check");
const { readVehicle } = require("../vehicles/vehicle.validator");
const v = require("../../shared/validate");
const { readCustomer } = require("./customer.validator");

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
