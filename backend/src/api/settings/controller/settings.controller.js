import * as settingsService from "../service/settings.service.js";
import { ok, badField } from "../../../shared/respond.js";
import { mergePatch } from "../../../shared/patch.js";
import { SETTINGS } from "../validations/settings.validation.js";

// The route checks every field first (validations/settings.validation.js).

async function get(req, res) {
  return ok(res, "Garage settings", await settingsService.get());
}

async function getPublic(req, res) {
  return ok(res, "Garage", await settingsService.getPublic());
}

async function update(req, res) {
  const settings = mergePatch(await settingsService.get(), req.body, SETTINGS);
  // Checked here, not in the rules, because one of the two times may be the saved one.
  if (settings.closing_time && settings.closing_time <= settings.opening_time) {
    throw badField("closing_time", "Closing time must be after the opening time");
  }
  return ok(res, "Settings saved", await settingsService.update({ ...settings, updated_at: new Date(req.body.updated_at) }));
}

async function roles(req, res) {
  return ok(res, "List fixed staff roles successful", await settingsService.listRoles());
}

export { get, getPublic, update, roles };
