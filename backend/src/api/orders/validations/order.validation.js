import { body, param, query } from "express-validator";
import { APPROVAL_METHODS } from "../../../shared/order-codes.js";
import { localToday } from "../../../shared/time.js";
import * as r from "../../../shared/rules.js";

const NOTES = ["estimated_ready_date", "notes_for_customer", "internal_notes"];
const EDITABLE = [...NOTES, "lines"];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isObject = (value) => !!value && typeof value === "object" && !Array.isArray(value);

// BE-029: a ready date can't be in the past (today in the garage's time zone is fine).
// On an edit the controller calls this only when the date changed, so an order whose date has passed can
// still get a new note.
const isPastDate = (date) => !!date && date < localToday();

function readyDate() {
  return body("estimated_ready_date")
    .customSanitizer((value) => (r.isEmpty(value) ? null : value))
    .custom((value) => value === null || (DATE_RE.test(value) && !Number.isNaN(Date.parse(value))))
    .withMessage("Ready date is not a valid date");
}

const notesRules = () => [
  readyDate(),
  r.optionalText("notes_for_customer", "Note for the customer", 2000),
  r.optionalText("internal_notes", "Internal note", 2000),
];

// A line is { service_id, price? } or an extra item { description, price }. Prices never come from the
// browser for list services unless staff typed a custom price (FR-ORD-03).
// On an estimate edit a line may also carry the line_id of the job it changes, so that job keeps its number
// and its technician.
// prefix is "lines.*." for the lines of an order, or "" when the body is one line.
function lineRules(prefix, { withLineId = false } = {}) {
  const lineOf = prefix ? ({ req, pathValues }) => req.body.lines[pathValues[0]] : ({ req }) => req.body;
  const serviceLine = (meta) => isObject(lineOf(meta)) && !!lineOf(meta).service_id;
  const extraLine = (meta) => isObject(lineOf(meta)) && !lineOf(meta).service_id;
  const at = (when) => (field) => body(field).if((value, meta) => when(value, meta));
  const rules = [
    r.requireId(`${prefix}service_id`, "Service", at((value) => !!value)),
    r.requireText(`${prefix}description`, "Extra item description", 255, at((value, meta) => extraLine(meta))),
    r.money(`${prefix}price`, "Price", at((value, meta) => serviceLine(meta) && !r.isEmpty(value))),
    r.money(`${prefix}price`, "Extra item price", at((value, meta) => extraLine(meta))),
  ];
  if (prefix) rules.unshift(body("lines.*").custom(isObject).withMessage("Job is not valid"));
  if (withLineId) rules.splice(1, 0, r.requireId(`${prefix}line_id`, "Job", (field) => body(field).optional({ values: "null" })));
  return rules;
}

// allowEmpty: an estimate edit may remove every unstarted job when started jobs stay on the order
// (the customer said no to the extra work); the service checks that at least one job remains.
// optional: an edit may leave the lines out. Only the list itself is optional; inside it every line is checked.
function linesRules({ allowEmpty = false, withLineId = false, optional = false } = {}) {
  const list = optional ? body("lines").optional() : body("lines");
  return [
    list
      .custom((lines) => Array.isArray(lines) && (lines.length > 0 || allowEmpty)).withMessage("Choose at least one service").bail()
      .custom((lines) => lines.length <= 50).withMessage("Too many jobs on one order"),
    ...lineRules("lines.*.", { withLineId }),
  ];
}

// The checked line, in a fixed shape for the service.
function toLine(raw) {
  const line = raw.service_id
    ? { service_id: raw.service_id, ...(r.isEmpty(raw.price) ? {} : { price: raw.price }) }
    : { service_id: null, description: raw.description, price: raw.price };
  if (raw.line_id) line.line_id = raw.line_id;
  return line;
}

const orderId = [r.requireId("id", "Order id", param)];

const createOrder = [
  body("mileage")
    .customSanitizer((value) => (r.isEmpty(value) ? null : value))
    .custom((value) => value === null || (Number.isInteger(Number(value)) && Number(value) >= 0)).withMessage("Mileage must be a whole number").bail()
    .customSanitizer((value) => (value === null ? null : Number(value))),
  r.requireId("customer_id", "Customer"),
  r.requireId("vehicle_id", "Car"),
  ...linesRules(),
  ...notesRules(),
  body("estimated_ready_date").custom((date) => !isPastDate(date)).withMessage("The ready date can't be in the past"),
];

const updateOrder = [
  ...orderId,
  r.somethingToChange(EDITABLE),
  ...r.editable(notesRules()),
  ...linesRules({ allowEmpty: true, withLineId: true, optional: true }),
  r.requireUpdatedAt(),
];

const addLine = [...orderId, ...lineRules("")];

const approval = [
  ...orderId,
  body("decision").custom((decision) => ["approve", "decline"].includes(decision)).withMessage("Choose approve or decline"),
  body("method").custom((method) => APPROVAL_METHODS.includes(method)).withMessage("Choose in person or by phone"),
  r.optionalText("note", "Note", 150),
];

const jobId = [r.requireId("id", "Job id", param)];

// BE-035: there is no un-assign; a job always moves to another technician.
const assignTechnician = [...jobId, r.requireId("technician_id", "Technician")];

const lineStatus = [
  ...jobId,
  body("status").optional().customSanitizer(Number)
    .custom((status) => [1, 2].includes(status)).withMessage("Status must be 1 (Started) or 2 (Done)"),
  r.optionalText("note", "Work note", 2000).optional(),
  r.somethingToChange(["status", "note"], "Nothing to change"),
];

// BE-038
const lineNote = [
  ...jobId,
  body("technician_note").exists().withMessage("Write a work note"),
  r.optionalText("technician_note", "Work note", 2000),
];

// BE-030: ?status, ?paid (true|false or 1|0; missing means either), ?customer_id, ?vehicle_id and
// ?unpaid_only (completed and not yet paid).
function queryFlag(field) {
  return query(field)
    .customSanitizer((value) => (value === undefined || value === "" ? null : value))
    .custom((value) => [null, "true", "1", "false", "0"].includes(value)).withMessage(`${field} must be true or false`).bail()
    .customSanitizer((value) => (value === null ? null : value === "true" || value === "1"));
}

const queryId = (field, label) => r.requireId(field, label, (f) => query(f).customSanitizer((value) => (value === "" ? undefined : value)).optional());

const listOrders = [
  query("status")
    .customSanitizer((value) => (value ? Number(value) : null))
    .custom((status) => status === null || (status >= 1 && status <= 5)).withMessage("Unknown status"),
  queryFlag("paid"),
  queryFlag("unpaid_only").bail()
    .custom((unpaidOnly, { req }) => unpaidOnly !== true || (req.query.paid !== true && (req.query.status === null || req.query.status === 4)))
    .withMessage("Unpaid (completed) only covers completed orders that aren't paid, so it can't be combined with Paid or another status"),
  queryId("customer_id", "Customer"),
  queryId("vehicle_id", "Car"),
];

export {
  NOTES, EDITABLE, isPastDate, toLine, orderId, createOrder, updateOrder, addLine, approval, assignTechnician,
  lineStatus, lineNote, listOrders,
};
