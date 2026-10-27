import { badField } from "../../../shared/respond.js";
import { readUpdatedAt } from "../../../shared/stale-check.js";
import * as v from "../../../shared/validate.js";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function readTime(body, field, label, required) {
  const value = body[field];
  if (value == null || value === "") {
    if (required) throw badField(field, `${label} is required`);
    return null;
  }
  if (!TIME_RE.test(value)) throw badField(field, `${label} must look like 08:00`);
  return value;
}

function readSettings(body) {
  const vatRate = Number(body.vat_rate);
  if (body.vat_rate === "" || !Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
    throw badField("vat_rate", "VAT rate must be a number from 0 to 100");
  }
  const opening = readTime(body, "opening_time", "Opening time", true);
  const closing = readTime(body, "closing_time", "Closing time", false);
  if (closing && closing <= opening) throw badField("closing_time", "Closing time must be after the opening time");
  return {
    name: v.requireText(body, "name", "Garage name", 100),
    address: v.optionalText(body, "address", "Address"),
    phone: v.optionalText(body, "phone", "Phone", 30),
    email: body.email ? v.requireEmail(body) : null,
    vat_rate: vatRate.toFixed(2),
    opening_time: opening,
    closing_time: closing,
    updated_at: readUpdatedAt(body),
  };
}

export { readSettings };
