import * as customerService from "../service/customer.service.js";
import { ok, created } from "../../../shared/respond.js";
import { readPage } from "../../../shared/pagination.js";
import { pickCar } from "../../vehicles/validations/vehicle.validation.js";
import { mergePatch } from "../../../shared/patch.js";
import { CUSTOMER } from "../validations/customer.validation.js";

// The routes check every field first (validations/customer.validation.js).

async function create(req, res) {
  const customer = Object.fromEntries(CUSTOMER.map((name) => [name, req.body[name]]));
  const vehicle = req.body.vehicle ? pickCar(req.body.vehicle) : null;
  return created(res, "Customer added", await customerService.create(customer, vehicle));
}

async function list(req, res) {
  const page = readPage(req.query);
  const data = await customerService.list({ ...page, activeOnly: req.query.active === "1" });
  return ok(res, "Customers", data);
}

async function getOne(req, res) {
  return ok(res, "Customer", await customerService.getProfile(req.params.id));
}

async function update(req, res) {
  const id = req.params.id;
  const customer = mergePatch(await customerService.getById(id), req.body, CUSTOMER);
  return ok(res, "Customer saved", await customerService.update(id, customer, new Date(req.body.updated_at)));
}

export { create, list, getOne, update };
