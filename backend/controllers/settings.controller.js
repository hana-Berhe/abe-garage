const settingsService = require("../services/settings.service");
const { ok, badField } = require("../utils/respond");
const v = require("../utils/validate");

async function get(req, res) {
  return ok(res, "Garage settings", await settingsService.get());
}

async function update(req, res) {
  const vatRate = Number(req.body.vat_rate);
  if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
    throw badField("vat_rate", "VAT rate must be a number from 0 to 100");
  }
  if (!req.body.updated_at || Number.isNaN(Date.parse(req.body.updated_at))) {
    throw badField("updated_at", "updated_at from the loaded record is required");
  }
  const email = req.body.email ? v.requireEmail(req.body) : null;
  const data = {
    name: v.requireText(req.body, "name", "Garage name", 100),
    address: v.optionalText(req.body, "address", "Address"),
    phone: v.optionalText(req.body, "phone", "Phone", 30),
    email,
    vat_rate: vatRate.toFixed(2),
    updated_at: req.body.updated_at,
  };
  return ok(res, "Settings saved", await settingsService.update(data));
}

module.exports = { get, update };
