const { ok, created, badField } = require("../../shared/respond");
const v = require("../../shared/validate");

// Money is never rounded quietly: at most two decimals, or the field is refused.
function readMoney(body, field, label) {
  const raw = body[field];
  const n = Number(raw);
  if (raw === "" || raw == null || !Number.isFinite(n) || n < 0 || n > 99999999) {
    throw badField(field, `${label} must be a number of 0 or more`);
  }
  if (!/^\d+(\.\d{1,2})?$/.test(String(raw).trim())) throw badField(field, `${label} can have at most two decimals`);
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

module.exports = { readMoney, readService };
