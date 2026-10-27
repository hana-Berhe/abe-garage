import * as settingsService from "../service/settings.service.js";
import { ok } from "../../../shared/respond.js";
import { mergePatch } from "../../../shared/patch.js";
import { readSettings } from "../validations/settings.validation.js";

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

async function roles(req, res) {
  return ok(res, "List fixed staff roles successful", await settingsService.listRoles());
}

export { get, getPublic, update, roles };
