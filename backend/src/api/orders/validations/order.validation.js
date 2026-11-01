import { body, query } from "express-validator";
import { APPROVAL_METHODS } from "../../../shared/order-codes.js";
import { localToday } from "../../../shared/time.js";
import * as r from "../../../shared/rules.js";

const NOTES = ["estimated_ready_date", "notes_for_customer", "internal_notes"];
const EDITABLE = [...NOTES, "lines"];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// BE-029: a ready date can't be in the past (today in the garage's time zone is fine).
// On an edit the controller checks this only when the date changed, so an order whose date has passed can
// still get a new note.
const isPastDate = (date) => !!date && date < localToday();

const readyDate = (chain) =>
  chain
    .customSanitizer(r.emptyToNull)
    .custom((date) => date === null || (DATE_RE.test(date) && !Number.isNaN(Date.parse(date)))).withMessage("Ready date is not a valid date");

const notesShape = () => [
  readyDate(body("estimated_ready_date")),
  r.optionalText(body("notes_for_customer"), "Note for the customer", 2000),
  r.optionalText(body("internal_notes"), "Internal note", 2000),
];

// A line is { service_id, price? } or an extra item { description, price }. Prices never come from the
// browser for list services unless staff typed a custom price (FR-ORD-03).
// On an estimate edit a line may also carry the line_id of the job it changes, so that job keeps its number
// and its technician. The line is left in the shape the service takes.
//   prefix: "" when the body is the line, "lines.*." for each line of an order.
//   line(req, meta): the line a field belongs to, read from the request.
const lineRules = ({ prefix = "", line, withLineId = false } = {}) => {
  const hasService = (value, meta) => !!line(meta.req, meta).service_id;
  const isExtra = (value, meta) => !hasService(value, meta);
  const isLine = (value, meta) => r.isObject(line(meta.req, meta));
  const field = (name) => body(prefix + name).if(isLine);
  const rules = [];
  if (withLineId) rules.push(r.requireId(field("line_id").if((value) => value != null), "Job"));
  rules.push(
    r.requireId(field("service_id").if(hasService), "Service"),
    r.money(field("price").if(hasService).if((value) => !r.isEmpty(value)), "Price"),
    r.requireText(field("description").if(isExtra), "Extra item description"),
    r.money(field("price").if(isExtra), "Extra item price")
  );
  // The checked line, without the fields the service doesn't read.
  rules.push(
    body(prefix.replace(/\.$/, "")).if(isLine).customSanitizer((raw) => {
      const result = raw.service_id
        ? { service_id: raw.service_id, ...(r.isEmpty(raw.price) ? {} : { price: raw.price }) }
        : { service_id: null, description: raw.description, price: raw.price };
      if (withLineId && raw.line_id != null) result.line_id = raw.line_id;
      return result;
    })
  );
  return rules;
};

// The body is one line (POST /orders/:id/lines).
const lineSchema = () => lineRules({ line: (req) => req.body });

// The lines of an order: lines.0, lines.1... Each must be an object ("Job is not valid").
// allowEmpty: an estimate edit may remove every unstarted job when started jobs stay on the order
// (the customer said no to the extra work); the service checks that at least one job remains.
const linesSchema = ({ allowEmpty = false, withLineId = false } = {}) => [
  body("lines")
    .custom((lines) => Array.isArray(lines) && lines.length >= (allowEmpty ? 0 : 1)).withMessage("Choose at least one service")
    .custom((lines) => !Array.isArray(lines) || lines.length <= 50).withMessage("Too many jobs on one order"),
  body("lines.*").if((value, { req }) => Array.isArray(req.body.lines)).custom(r.isObject).withMessage("Job is not valid"),
  ...lineRules({ prefix: "lines.*.", withLineId, line: (req, { pathValues }) => (Array.isArray(req.body.lines) ? req.body.lines[pathValues[0]] : undefined) }),
];

const orderId = [r.idParams("Order id")];

const [estimatedReadyDate, ...otherNotes] = notesShape();

const createOrder = [
  body("mileage")
    .customSanitizer(r.emptyToNull)
    .custom((value) => value === null || (Number.isInteger(Number(value)) && Number(value) >= 0)).withMessage("Mileage must be a whole number")
    .customSanitizer((value) => (value === null ? null : Number(value))),
  r.requireId(body("customer_id"), "Customer"),
  r.requireId(body("vehicle_id"), "Car"),
  ...linesSchema(),
  estimatedReadyDate.custom((date) => !isPastDate(date)).withMessage("The ready date can't be in the past"),
  ...otherNotes,
];

// `lines` may be left out on an edit, but when sent it is checked as on a new order: the "lines" chain is the
// editable field and the per-line chains run after it (only when lines is an array).
const [updateLines, ...updateLineItems] = linesSchema({ allowEmpty: true, withLineId: true });
const updateOrder = [r.idParams("Order id"), ...r.editable([...notesShape(), updateLines], { also: updateLineItems })];

const addLine = [r.idParams("Order id"), ...lineSchema()];

const approval = [
  r.idParams("Order id"),
  body("decision").custom((decision) => ["approve", "decline"].includes(decision)).withMessage("Choose approve or decline"),
  body("method").custom((method) => APPROVAL_METHODS.includes(method)).withMessage("Choose in person or by phone"),
  r.optionalText(body("note"), "Note", 150),
];

// BE-035: there is no un-assign; a job always moves to another technician.
const assignTechnician = [r.idParams("Job id"), r.requireId(body("technician_id"), "Technician")];

const lineStatus = [
  r.idParams("Job id"),
  ...r.editable(
    [
      body("status").customSanitizer(Number).custom((status) => [1, 2].includes(status)).withMessage("Status must be 1 (Started) or 2 (Done)"),
      r.optionalText(body("note"), "Work note", 2000),
    ],
    { updatedAt: false, nothing: "Nothing to change" }
  ),
];

// BE-038
const lineNote = [
  r.idParams("Job id"),
  r.optionalText(body("technician_note").custom((note) => note !== undefined).withMessage("Write a work note"), "Work note", 2000),
];

// BE-030: ?status, ?paid (true|false or 1|0; missing means either), ?customer_id, ?vehicle_id and
// ?unpaid_only (completed and not yet paid). Other query fields (page, search) pass through untouched.
const queryFlag = (field) =>
  query(field)
    .customSanitizer((value) => (value === undefined || value === "" ? null : value))
    .custom((value) => [null, "true", "1", "false", "0"].includes(value)).withMessage(`${field} must be true or false`)
    .customSanitizer((value) => (value === null ? null : value === "true" || value === "1"));

const queryId = (field, label) =>
  r.requireId(query(field).customSanitizer((value) => (value === "" ? undefined : value)).if((value) => value !== undefined), label);

const listOrders = [
  query("status")
    .customSanitizer((value) => (value ? Number(value) : null))
    .custom((status) => status === null || (status >= 1 && status <= 5)).withMessage("Unknown status"),
  queryFlag("paid"),
  queryFlag("unpaid_only"),
  queryId("customer_id", "Customer"),
  queryId("vehicle_id", "Car"),
  query("unpaid_only")
    .custom((unpaidOnly, { req }) => {
      const q = req.query;
      return !(unpaidOnly === true && (q.paid === true || (q.status !== null && q.status !== 4)));
    })
    .withMessage("Unpaid (completed) only covers completed orders that aren't paid, so it can't be combined with Paid or another status"),
];

export {
  NOTES, EDITABLE, isPastDate, orderId, createOrder, updateOrder, addLine, approval, assignTechnician, lineStatus,
  lineNote, listOrders,
};
