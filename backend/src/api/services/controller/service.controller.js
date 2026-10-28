import * as serviceService from "../service/service.service.js";
import { ok, created } from "../../../shared/respond.js";
import { mergePatch } from "../../../shared/patch.js";
import { SERVICE } from "../validations/service.validation.js";

// The routes check every field first (validations/service.validation.js).
const pickService = (source) => Object.fromEntries(SERVICE.map((name) => [name, source[name]]));

async function create(req, res) {
  return created(res, "Service added", await serviceService.create(pickService(req.body)));
}

async function list(req, res) {
  return ok(res, "Services", await serviceService.listAll());
}

async function listPublic(req, res) {
  return ok(res, "Services", await serviceService.listPublic());
}

async function update(req, res) {
  const id = req.params.id;
  const service = mergePatch(await serviceService.getById(id), req.body, SERVICE);
  return ok(res, "Service saved", await serviceService.update(id, service, new Date(req.body.updated_at)));
}

export { create, list, listPublic, update };
