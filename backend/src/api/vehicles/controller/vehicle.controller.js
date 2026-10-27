import * as vehicleService from "../service/vehicle.service.js";
import { ok, created } from "../../../shared/respond.js";
import { mergePatch } from "../../../shared/patch.js";
import { CAR, pickCar } from "../validations/vehicle.validation.js";
import { readPage } from "../../../shared/pagination.js";

// The routes check every field first (validations/vehicle.validation.js).

async function create(req, res) {
  const vehicle = { ...pickCar(req.body), customer_id: req.body.customer_id };
  return created(res, "Car added", await vehicleService.create(vehicle));
}

async function listForCustomer(req, res) {
  return ok(res, "Cars", await vehicleService.listForCustomer(req.params.id));
}

async function getOne(req, res) {
  return ok(res, "Car", await vehicleService.getWithHistory(req.params.id));
}

async function listOrders(req, res) {
  return ok(res, "View vehicle service history successful", await vehicleService.listOrders(req.params.id, readPage(req.query)));
}

async function update(req, res) {
  const id = req.params.id;
  const vehicle = mergePatch(await vehicleService.getById(id), req.body, CAR);
  return ok(res, "Car saved", await vehicleService.update(id, vehicle, new Date(req.body.updated_at)));
}

export { create, listForCustomer, getOne, listOrders, update };
