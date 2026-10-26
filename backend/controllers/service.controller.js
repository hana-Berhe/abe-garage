const serviceService = require("../services/service.service");
const { ok, created, badField } = require("../utils/respond");
const { readUpdatedAt } = require("../utils/staleCheck");
const v = require("../utils/validate");

function readMoney(body, field, label) {
  const n = Number(body[field]);
  if (body[field] === "" || body[field] == null || !Number.isFinite(n) || n < 0 || n > 99999999) {
    throw badField(field, `${label} must be a number of 0 or more`);
  }
  return n.toFixed(2);
}

function readService(body) {
  const hours = body.labor_hours === "" || body.labor_hours == null ? 0 : Number(body.labor_hours);
  if (!Number.isFinite(hours) || hours < 0 || hours > 99) throw badField("labor_hours", "Hours must be a number from 0 to 99");
  return {
    name: v.requireText(body, "name", "Service name", 100),
    description: v.optionalText(body, "description", "Description", 2000),
    price: readMoney(body, "price", "Price"),
    labor_hours: hours.toFixed(2),
    active: body.active === undefined ? 1 : v.toFlag(body.active, "active", "Active"),
  };
}

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

module.exports = { create, list, listPublic, update, readMoney };
