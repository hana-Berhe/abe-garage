import * as serviceService from "../service/service.service.js";
import { ok, created, badField } from "../../../shared/respond.js";
import { readUpdatedAt } from "../../../shared/stale-check.js";
import * as v from "../../../shared/validate.js";
import { mergePatch } from "../../../shared/patch.js";
import { readMoney, readService } from "../validations/service.validation.js";

const EDITABLE = ["name", "description", "price", "labor_hours", "active"];

async function create(req, res) {
  return created(res, "Service added", await serviceService.create(readService(req.body)));
}

async function list(req, res) {
  return ok(res, "Services", await serviceService.listAll());
}

async function listPublic(req, res) {
  return ok(res, "Services", await serviceService.listPublic());
}

async function update(req, res) {
  const id = v.requireId(req.params.id, "id", "Service id");
  const service = readService(mergePatch(await serviceService.getById(id), req.body, EDITABLE));
  return ok(res, "Service saved", await serviceService.update(id, service, readUpdatedAt(req.body)));
}

export { create, list, listPublic, update };
