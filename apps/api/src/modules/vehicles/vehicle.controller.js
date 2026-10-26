const vehicleService = require("./vehicle.service");
const { ok, created, badField } = require("../../shared/respond");
const { readUpdatedAt } = require("../../shared/stale-check");
const v = require("../../shared/validate");
const { readVehicle } = require("./vehicle.validator");

async function create(req, res) {
  const vehicle = readVehicle(req.body);
  vehicle.customer_id = v.requireId(req.body.customer_id, "customer_id", "Customer");
  return created(res, "Car added", await vehicleService.create(vehicle));
}

async function listForCustomer(req, res) {
  const id = v.requireId(req.params.id, "id", "Customer id");
  return ok(res, "Cars", await vehicleService.listForCustomer(id));
}

async function getOne(req, res) {
  const id = v.requireId(req.params.id, "id", "Car id");
  return ok(res, "Car", await vehicleService.getWithHistory(id));
}

async function update(req, res) {
  const id = v.requireId(req.params.id, "id", "Car id");
  const vehicle = readVehicle(req.body);
  return ok(res, "Car saved", await vehicleService.update(id, vehicle, readUpdatedAt(req.body)));
}

module.exports = { create, listForCustomer, getOne, update };
