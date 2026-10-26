const callbackService = require("./callback.service");
const { ok, created } = require("../../shared/respond");
const { readPage } = require("../../shared/pagination");
const v = require("../../shared/validate");
const { readCallback } = require("./callback.validator");

async function create(req, res) {
  // A hidden "website" field that people never see; bots that fill it get a normal answer and nothing is saved.
  if (req.body.website) return created(res, "Thanks, we will call you back", null);
  await callbackService.create(readCallback(req.body));
  return created(res, "Thanks, we will call you back", null);
}

async function list(req, res) {
  const status = ["new", "called", "all"].includes(req.query.status) ? req.query.status : "new";
  return ok(res, "Call-back requests", await callbackService.list({ ...readPage(req.query), status }));
}

async function markCalled(req, res) {
  const id = v.requireId(req.params.id, "id", "Call-back request id");
  return ok(res, "Marked as called", await callbackService.markCalled(id, req.employee.id));
}

module.exports = { create, list, markCalled };
