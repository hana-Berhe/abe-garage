const { badField } = require("./respond");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireText(body, field, label, max = 255) {
  const value = typeof body[field] === "string" ? body[field].trim() : "";
  if (!value) throw badField(field, `${label} is required`);
  if (value.length > max) throw badField(field, `${label} is too long (max ${max})`);
  return value;
}

function optionalText(body, field, label, max = 255) {
  if (body[field] == null || body[field] === "") return null;
  if (typeof body[field] !== "string") throw badField(field, `${label} must be text`);
  const value = body[field].trim();
  if (value.length > max) throw badField(field, `${label} is too long (max ${max})`);
  return value || null;
}

function requireEmail(body, field = "email") {
  const value = requireText(body, field, "Email").toLowerCase();
  if (!EMAIL_RE.test(value)) throw badField(field, "Email is not valid");
  return value;
}

function requirePassword(body, field = "password") {
  const value = typeof body[field] === "string" ? body[field] : "";
  if (value.length < 8) throw badField(field, "Password must be at least 8 characters");
  // bcrypt only reads the first 72 bytes, and letters like "é" or "አ" take more than one byte.
  if (Buffer.byteLength(value, "utf8") > 72) throw badField(field, "Password is too long (max 72 bytes)");
  return value;
}

function requireId(value, field, label) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw badField(field, `${label} is not valid`);
  return n;
}

function toFlag(value, field, label) {
  if (value === true || value === 1 || value === "1") return 1;
  if (value === false || value === 0 || value === "0") return 0;
  throw badField(field, `${label} must be yes or no`);
}

module.exports = { requireText, optionalText, requireEmail, requirePassword, requireId, toFlag };
