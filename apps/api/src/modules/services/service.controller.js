const serviceService = require("./service.service");
const { ok, created, badField } = require("../../shared/respond");
const { readUpdatedAt } = require("../../shared/stale-check");
const v = require("../../shared/validate");
const { readMoney, readService } = require("./service.validator");

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
  return ok(res, "Service saved", await serviceService.update(id, readService(req.body), readUpdatedAt(req.body)));
}

module.exports = { create, list, listPublic, update };
