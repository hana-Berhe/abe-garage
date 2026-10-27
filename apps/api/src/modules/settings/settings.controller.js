const settingsService = require("./settings.service");
const { ok } = require("../../shared/respond");
const { mergePatch } = require("../../shared/patch");
const { readSettings } = require("./settings.validator");

const EDITABLE = ["name", "address", "phone", "email", "vat_rate", "opening_time", "closing_time"];

async function get(req, res) {
  return ok(res, "Garage settings", await settingsService.get());
}

async function getPublic(req, res) {
  return ok(res, "Garage", await settingsService.getPublic());
}

async function update(req, res) {
  const merged = mergePatch(await settingsService.get(), req.body, EDITABLE);
  return ok(res, "Settings saved", await settingsService.update(readSettings({ ...merged, updated_at: req.body.updated_at })));
}

module.exports = { get, getPublic, update };
