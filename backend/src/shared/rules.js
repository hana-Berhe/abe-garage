import { z } from "zod";

// Zod field schemas shared by every feature's validations file.
// Each keeps the app's own message, and turns the input into the value the service saves
// (trimmed text, numbers, 0/1 flags, "12.50" money), so controllers read req.body, req.params and req.query directly.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isEmpty = (value) => value === undefined || value === null || value === "";
const emptyToNull = (value) => (isEmpty(value) ? null : value);
const validDate = (value) => !!value && !Number.isNaN(Date.parse(value));

const requireText = (label, max = 255) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max, `${label} is too long (max ${max})`);

// Missing, null or "" is saved as null.
const optionalText = (label, max = 255) =>
  z.preprocess(
    emptyToNull,
    z.string({ error: `${label} must be text` }).trim().max(max, `${label} is too long (max ${max})`).transform((value) => value || null).nullable()
  );

const requireEmail = () => requireText("Email").toLowerCase().regex(EMAIL_RE, "Email is not valid");

const requirePassword = () =>
  z.string({ error: "Password must be at least 8 characters" })
    .min(8, "Password must be at least 8 characters")
    // bcrypt only reads the first 72 bytes, and letters like "é" or "አ" take more than one byte.
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password is too long (max 72 bytes)");

const requireId = (label) =>
  z.any().refine((value) => Number.isInteger(Number(value)) && Number(value) >= 1, `${label} is not valid`).transform(Number);

// Yes/no fields are saved as 1 or 0. Left out on an add, they are 1.
const flag = (label) =>
  z.preprocess(
    (value) => (value === undefined ? 1 : value),
    z.any()
      .refine((value) => [true, 1, "1", false, 0, "0"].includes(value), `${label} must be yes or no`)
      .transform((value) => (value === true || value === 1 || value === "1" ? 1 : 0))
  );

// Money is never rounded quietly: at most two decimals, or the field is refused. Saved as "12.50".
const money = (label) =>
  z.any()
    .refine((value) => {
      const n = Number(value);
      return !isEmpty(value) && Number.isFinite(n) && n >= 0 && n <= 99999999;
    }, `${label} must be a number of 0 or more`)
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(String(value).trim()), `${label} can have at most two decimals`)
    .transform((value) => Number(value).toFixed(2));

// Missing, null or "" is saved as null. `max` may be a function, for limits that move with the date.
function optionalInt(label, min, max) {
  const top = () => (typeof max === "function" ? max() : max);
  return z.preprocess(
    emptyToNull,
    z.any()
      .refine((value) => value === null || (Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= top()), {
        error: () => `${label} must be a whole number from ${min} to ${top()}`,
      })
      .transform((value) => (value === null ? null : Number(value)))
  );
}

// URL ids, such as /api/customers/:id.
const idParams = (label) => z.object({ id: requireId(label) });

// PATCH: a field left out keeps its saved value, so every field is optional, but at least one must be sent
// (the error names the first one) and, for records, the updated_at that was loaded (NFR-16).
// These two run after the field checks, even when a field is wrong.
// `fields` lists the editable fields in the order the message names them (default: the shape's order).
function editable(shape, { fields = Object.keys(shape), updatedAt = true, nothing } = {}) {
  const message = nothing || `Nothing to change. Send at least one of: ${fields.join(", ")}`;
  const object = z.object({ ...shape, ...(updatedAt ? { updated_at: z.any() } : {}) }).partial();
  return object.superRefine(
    (body, ctx) => {
      if (!fields.some((f) => body[f] !== undefined)) ctx.addIssue({ code: "custom", path: [fields[0]], message });
      if (updatedAt && !validDate(body.updated_at)) {
        ctx.addIssue({ code: "custom", path: ["updated_at"], message: "updated_at from the loaded record is required" });
      }
    },
    { when: () => true }
  );
}

export {
  isEmpty, emptyToNull, requireText, optionalText, requireEmail, requirePassword, requireId, flag, money, optionalInt,
  idParams, editable,
};
