import { body, param } from "express-validator";

// express-validator field rules shared by every feature's validations file.
// Each helper takes a chain (body("first_name"), param("id"), query("paid")...), keeps the app's own message,
// and turns the input into the value the service saves (trimmed text, numbers, 0/1 flags, "12.50" money)
// in place, so controllers read req.body, req.params and req.query directly.
// A field gets one message: the first failed check in its chain (validate.js keeps the first per field).
// express-validator's bail() is not used, because it stops a chain for every item of a list (lines.*.price)
// as soon as one item fails; so later checks and sanitizers in a chain still run on a value that already
// failed, and every sanitizer here accepts any value.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isEmpty = (value) => value === undefined || value === null || value === "";
const emptyToNull = (value) => (isEmpty(value) ? null : value);
const validDate = (value) => !!value && !Number.isNaN(Date.parse(value));
const isObject = (value) => !!value && typeof value === "object" && !Array.isArray(value);

const requireText = (chain, label, max = 255) =>
  chain
    .isString().withMessage(`${label} is required`)
    .trim()
    .notEmpty().withMessage(`${label} is required`)
    .isLength({ max }).withMessage(`${label} is too long (max ${max})`);

// Missing, null or "" is saved as null.
const optionalText = (chain, label, max = 255) =>
  chain
    .customSanitizer(emptyToNull)
    .custom((value) => value === null || typeof value === "string").withMessage(`${label} must be text`)
    .customSanitizer((value) => (typeof value === "string" ? value.trim() || null : value))
    .custom((value) => value === null || String(value).length <= max).withMessage(`${label} is too long (max ${max})`);

const requireEmail = (chain) =>
  requireText(chain, "Email").toLowerCase().matches(EMAIL_RE).withMessage("Email is not valid");

const requirePassword = (chain) =>
  chain
    .custom((value) => typeof value === "string" && value.length >= 8).withMessage("Password must be at least 8 characters")
    // bcrypt only reads the first 72 bytes, and letters like "é" or "አ" take more than one byte.
    .custom((value) => Buffer.byteLength(value, "utf8") <= 72).withMessage("Password is too long (max 72 bytes)");

const isId = (value) => Number.isInteger(Number(value)) && Number(value) >= 1;

// A bad id is left as sent, so a rule on another field can still tell whether one was given.
const requireId = (chain, label) =>
  chain.custom(isId).withMessage(`${label} is not valid`).customSanitizer((value) => (isId(value) ? Number(value) : value));

// Yes/no fields are saved as 1 or 0. Left out on an add, they are 1.
const flag = (chain, label) =>
  chain
    .customSanitizer((value) => (value === undefined ? 1 : value))
    .custom((value) => [true, 1, "1", false, 0, "0"].includes(value)).withMessage(`${label} must be yes or no`)
    .customSanitizer((value) => (value === true || value === 1 || value === "1" ? 1 : 0));

// Money is never rounded quietly: at most two decimals, or the field is refused. Saved as "12.50".
const money = (chain, label) =>
  chain
    .custom((value) => {
      const n = Number(value);
      return !isEmpty(value) && Number.isFinite(n) && n >= 0 && n <= 99999999;
    }).withMessage(`${label} must be a number of 0 or more`)
    .custom((value) => /^\d+(\.\d{1,2})?$/.test(String(value).trim())).withMessage(`${label} can have at most two decimals`)
    .customSanitizer((value) => Number(value).toFixed(2));

// Missing, null or "" is saved as null. `max` may be a function, for limits that move with the date.
function optionalInt(chain, label, min, max) {
  const top = () => (typeof max === "function" ? max() : max);
  return chain
    .customSanitizer(emptyToNull)
    .custom((value) => value === null || (Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= top()))
    .withMessage(() => `${label} must be a whole number from ${min} to ${top()}`)
    .customSanitizer((value) => (value === null ? null : Number(value)));
}

// URL ids, such as /api/customers/:id.
const idParams = (label) => requireId(param("id"), label);

// The field a chain checks, e.g. "first_name".
const fieldOf = (chain) => chain.builder.build().fields[0];

// PATCH: a field left out keeps its saved value, so every field is optional, but at least one must be sent
// (the error names the first one) and, for records, the updated_at that was loaded (NFR-16).
// These two run after the field checks, even when a field is wrong.
// `fields` lists the editable fields in the order the message names them (default: the chains' order).
// `also` are chains that run after the fields but before these two checks, e.g. the items of an editable list.
function editable(chains, { fields = chains.map(fieldOf), updatedAt = true, nothing, also = [] } = {}) {
  const message = nothing || `Nothing to change. Send at least one of: ${fields.join(", ")}`;
  const rules = [...chains.map((chain) => chain.optional()), ...also];
  rules.push(body(fields[0]).custom((value, { req }) => fields.some((f) => req.body[f] !== undefined)).withMessage(message));
  if (updatedAt) rules.push(body("updated_at").custom(validDate).withMessage("updated_at from the loaded record is required"));
  return rules;
}

export {
  isEmpty, emptyToNull, isObject, validDate, requireText, optionalText, requireEmail, requirePassword, requireId, flag, money,
  optionalInt, idParams, editable,
};
