import { ok, created, badField } from "../../../shared/respond.js";
import { readMoney } from "../../services/validations/service.validation.js";
import * as v from "../../../shared/validate.js";
import { localToday } from "../../../shared/time.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function readDate(body, field, label) {
  if (body[field] == null || body[field] === "") return null;
  if (!DATE_RE.test(body[field]) || Number.isNaN(Date.parse(body[field]))) throw badField(field, `${label} is not a valid date`);
  return body[field];
}

// A line is { service_id, price? } or an extra item { description, price }. Prices never come from the
// browser for list services unless staff typed a custom price (FR-ORD-03).
// On an estimate edit a line may also carry the line_id of the job it changes, so that job keeps its number
// and its technician.
function readLine(raw, field) {
  if (!raw || typeof raw !== "object") throw badField(field, "Job is not valid");
  const lineId = raw.line_id == null ? undefined : v.requireId(raw.line_id, `${field}.line_id`, "Job");
  let line;
  if (raw.service_id) {
    line = { service_id: v.requireId(raw.service_id, `${field}.service_id`, "Service") };
    if (raw.price !== undefined && raw.price !== null && raw.price !== "") line.price = readMoney(raw, "price", "Price");
  } else {
    const description = v.requireText(raw, "description", "Extra item description", 255);
    line = { service_id: null, description, price: readMoney(raw, "price", "Extra item price") };
  }
  if (lineId) line.line_id = lineId;
  return line;
}

// allowEmpty: an estimate edit may remove every unstarted job when started jobs stay on the order
// (the customer said no to the extra work); the service checks that at least one job remains.
function readLines(body, { allowEmpty = false } = {}) {
  if (!Array.isArray(body.lines) || (body.lines.length === 0 && !allowEmpty)) throw badField("lines", "Choose at least one service");
  if (body.lines.length > 50) throw badField("lines", "Too many jobs on one order");
  return body.lines.map((l, i) => readLine(l, `lines.${i}`));
}

// BE-029: a ready date can't be in the past (today in the garage's time zone is fine).
function checkReadyDate(date) {
  if (date && date < localToday()) throw badField("estimated_ready_date", "The ready date can't be in the past");
}

function readNotes(body) {
  return {
    estimated_ready_date: readDate(body, "estimated_ready_date", "Ready date"),
    notes_for_customer: v.optionalText(body, "notes_for_customer", "Note for the customer", 2000),
    internal_notes: v.optionalText(body, "internal_notes", "Internal note", 2000),
  };
}

export { readDate, readLine, readLines, readNotes, checkReadyDate };
