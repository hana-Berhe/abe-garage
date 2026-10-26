const settingsService = require("./settings.service");
const { ok } = require("../../shared/respond");
const { readSettings } = require("./settings.validator");

async function get(req, res) {
  return ok(res, "Garage settings", await settingsService.get());
}

async function getPublic(req, res) {
  return ok(res, "Garage", await settingsService.getPublic());
}

async function update(req, res) {
  return ok(res, "Settings saved", await settingsService.update(readSettings(req.body)));
}

module.exports = { get, getPublic, update };
