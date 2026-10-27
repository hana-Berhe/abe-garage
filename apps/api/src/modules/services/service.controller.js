const serviceService = require("./service.service");
const { ok, created, badField } = require("../../shared/respond");
const { readUpdatedAt } = require("../../shared/stale-check");
const v = require("../../shared/validate");
const { mergePatch } = require("../../shared/patch");
const { readMoney, readService } = require("./service.validator");

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

module.exports = { create, list, listPublic, update };
