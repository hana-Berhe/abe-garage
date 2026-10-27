import { body } from "express-validator";

// Rule builders for express-validator, shared by every feature's validations file.
// Each keeps the app's own message, and its sanitizers leave the cleaned value on the request
// (trimmed text, numbers, 0/1 flags), so controllers read req.body, req.params and req.query directly.
// `at` is where the field is: body (the default), param or query.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isFilledText = (value) => typeof value === "string" && value.trim() !== "";
const isEmpty = (value) => value === undefined || value === null || value === "";

function requireText(field, label, max = 255, at = body) {
  return at(field)
    .custom(isFilledText).withMessage(`${label} is required`).bail()
    .customSanitizer((value) => value.trim())
    .custom((value) => value.length <= max).withMessage(`${label} is too long (max ${max})`);
}

// Missing, null or "" is saved as null.
function optionalText(field, label, max = 255, at = body) {
  return at(field)
    .customSanitizer((value) => (isEmpty(value) ? null : value))
    .custom((value) => value === null || typeof value === "string").withMessage(`${label} must be text`).bail()
    .customSanitizer((value) => (value === null ? null : value.trim() || null))
    .custom((value) => value === null || value.length <= max).withMessage(`${label} is too long (max ${max})`);
}

function requireEmail(field = "email", at = body) {
  return requireText(field, "Email", 255, at).bail()
    .customSanitizer((value) => value.toLowerCase())
    .custom((value) => EMAIL_RE.test(value)).withMessage("Email is not valid");
}

function requirePassword(field = "password") {
  return body(field)
    .custom((value) => typeof value === "string" && value.length >= 8).withMessage("Password must be at least 8 characters").bail()
    // bcrypt only reads the first 72 bytes, and letters like "é" or "አ" take more than one byte.
    .custom((value) => Buffer.byteLength(value, "utf8") <= 72).withMessage("Password is too long (max 72 bytes)");
}

function requireId(field, label, at = body) {
  return at(field)
    .custom((value) => Number.isInteger(Number(value)) && Number(value) >= 1).withMessage(`${label} is not valid`).bail()
    .customSanitizer(Number);
}

// Yes/no fields are saved as 1 or 0. Left out on an add, they are 1.
function flag(field, label) {
  return body(field)
    .customSanitizer((value) => (value === undefined ? 1 : value))
    .custom((value) => [true, 1, "1", false, 0, "0"].includes(value)).withMessage(`${label} must be yes or no`).bail()
    .customSanitizer((value) => (value === true || value === 1 || value === "1" ? 1 : 0));
}

// Money is never rounded quietly: at most two decimals, or the field is refused. Saved as "12.50".
function money(field, label, at = body) {
  return at(field)
    .custom((value) => {
      const n = Number(value);
      return !isEmpty(value) && Number.isFinite(n) && n >= 0 && n <= 99999999;
    }).withMessage(`${label} must be a number of 0 or more`).bail()
    .custom((value) => /^\d+(\.\d{1,2})?$/.test(String(value).trim())).withMessage(`${label} can have at most two decimals`).bail()
    .customSanitizer((value) => Number(value).toFixed(2));
}

// Missing, null or "" is saved as null. `max` may be a function, for limits that move with the date.
function optionalInt(field, label, min, max, at = body) {
  const top = () => (typeof max === "function" ? max() : max);
  return at(field)
    .customSanitizer((value) => (isEmpty(value) ? null : value))
    .custom((value) => {
      if (value === null) return true;
      const n = Number(value);
      return Number.isInteger(n) && n >= min && n <= top();
    }).withMessage(() => `${label} must be a whole number from ${min} to ${top()}`).bail()
    .customSanitizer((value) => (value === null ? null : Number(value)));
}

// NFR-16: edits send the updated_at they loaded.
function requireUpdatedAt() {
  return body("updated_at")
    .custom((value) => !!value && !Number.isNaN(Date.parse(value))).withMessage("updated_at from the loaded record is required");
}

// PATCH: at least one editable field must be sent. The error names the first one.
function somethingToChange(fields, message = `Nothing to change. Send at least one of: ${fields.join(", ")}`) {
  return body(fields[0])
    .custom((value, { req }) => fields.some((f) => req.body[f] !== undefined)).withMessage(message);
}

// PATCH rules: a field left out keeps its saved value, so its rule is skipped.
const editable = (chains) => chains.map((chain) => chain.optional());

export {
  isEmpty, requireText, optionalText, requireEmail, requirePassword, requireId, flag, money, optionalInt,
  requireUpdatedAt, somethingToChange, editable,
};
