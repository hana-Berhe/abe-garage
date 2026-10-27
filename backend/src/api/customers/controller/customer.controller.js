import * as customerService from "../service/customer.service.js";
import { ok, created } from "../../../shared/respond.js";
import { readPage } from "../../../shared/pagination.js";
import { readUpdatedAt } from "../../../shared/stale-check.js";
import { readVehicle } from "../../vehicles/validations/vehicle.validation.js";
import * as v from "../../../shared/validate.js";
import { mergePatch } from "../../../shared/patch.js";
import { readCustomer } from "../validations/customer.validation.js";

const EDITABLE = ["first_name", "last_name", "email", "phone", "active"];

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
  const customer = readCustomer(mergePatch(await customerService.getById(id), req.body, EDITABLE));
  return ok(res, "Customer saved", await customerService.update(id, customer, readUpdatedAt(req.body)));
}

export { create, list, getOne, update };
