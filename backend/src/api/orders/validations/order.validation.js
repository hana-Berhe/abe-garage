import { z } from "zod";
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

const readyDate = () =>
  z.preprocess(
    r.emptyToNull,
    z.any().refine((date) => date === null || (DATE_RE.test(date) && !Number.isNaN(Date.parse(date))), "Ready date is not a valid date")
  );

const notesShape = () => ({
  estimated_ready_date: readyDate(),
  notes_for_customer: r.optionalText("Note for the customer", 2000),
  internal_notes: r.optionalText("Internal note", 2000),
});

// Checks one value with a field schema; on failure adds its first message under `path`.
function check(ctx, schema, value, path) {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  ctx.addIssue({ code: "custom", path, message: result.error.issues[0].message });
  return z.NEVER;
}

// A line is { service_id, price? } or an extra item { description, price }. Prices never come from the
// browser for list services unless staff typed a custom price (FR-ORD-03).
// On an estimate edit a line may also carry the line_id of the job it changes, so that job keeps its number
// and its technician. The result is the line in the shape the service takes.
const lineSchema = ({ withLineId = false } = {}) =>
  z.looseObject({}, { error: "Job is not valid" }).transform((raw, ctx) => {
    const lineId = withLineId && raw.line_id != null ? check(ctx, r.requireId("Job"), raw.line_id, ["line_id"]) : undefined;
    let line;
    if (raw.service_id) {
      line = { service_id: check(ctx, r.requireId("Service"), raw.service_id, ["service_id"]) };
      if (!r.isEmpty(raw.price)) line.price = check(ctx, r.money("Price"), raw.price, ["price"]);
    } else {
      const description = check(ctx, r.requireText("Extra item description"), raw.description, ["description"]);
      line = { service_id: null, description, price: check(ctx, r.money("Extra item price"), raw.price, ["price"]) };
    }
    if (lineId) line.line_id = lineId;
    return line;
  });

// allowEmpty: an estimate edit may remove every unstarted job when started jobs stay on the order
// (the customer said no to the extra work); the service checks that at least one job remains.
const linesSchema = ({ allowEmpty = false, withLineId = false } = {}) =>
  z.array(lineSchema({ withLineId }), { error: "Choose at least one service" })
    .min(allowEmpty ? 0 : 1, "Choose at least one service")
    .max(50, "Too many jobs on one order");

const orderId = { params: r.idParams("Order id") };

const createOrder = {
  body: z.object({
    mileage: z.preprocess(
      r.emptyToNull,
      z.any()
        .refine((value) => value === null || (Number.isInteger(Number(value)) && Number(value) >= 0), "Mileage must be a whole number")
        .transform((value) => (value === null ? null : Number(value)))
    ),
    customer_id: r.requireId("Customer"),
    vehicle_id: r.requireId("Car"),
    lines: linesSchema(),
    ...notesShape(),
    estimated_ready_date: readyDate().refine((date) => !isPastDate(date), "The ready date can't be in the past"),
  }),
};

const updateOrder = {
  params: r.idParams("Order id"),
  body: r.editable({ ...notesShape(), lines: linesSchema({ allowEmpty: true, withLineId: true }) }),
};

const addLine = { params: r.idParams("Order id"), body: lineSchema() };

const approval = {
  params: r.idParams("Order id"),
  body: z.object({
    decision: z.any().refine((decision) => ["approve", "decline"].includes(decision), "Choose approve or decline"),
    method: z.any().refine((method) => APPROVAL_METHODS.includes(method), "Choose in person or by phone"),
    note: r.optionalText("Note", 150),
  }),
};

// BE-035: there is no un-assign; a job always moves to another technician.
const assignTechnician = { params: r.idParams("Job id"), body: z.object({ technician_id: r.requireId("Technician") }) };

const lineStatus = {
  params: r.idParams("Job id"),
  body: r.editable(
    {
      status: z.any().transform(Number).refine((status) => [1, 2].includes(status), "Status must be 1 (Started) or 2 (Done)"),
      note: r.optionalText("Work note", 2000),
    },
    { updatedAt: false, nothing: "Nothing to change" }
  ),
};

// BE-038
const lineNote = {
  params: r.idParams("Job id"),
  body: z.object({
    technician_note: z.any().refine((note) => note !== undefined, "Write a work note").pipe(r.optionalText("Work note", 2000)),
  }),
};

// BE-030: ?status, ?paid (true|false or 1|0; missing means either), ?customer_id, ?vehicle_id and
// ?unpaid_only (completed and not yet paid). Other query fields (page, search) pass through untouched.
const queryFlag = (field) =>
  z.preprocess(
    (value) => (value === undefined || value === "" ? null : value),
    z.any()
      .refine((value) => [null, "true", "1", "false", "0"].includes(value), `${field} must be true or false`)
      .transform((value) => (value === null ? null : value === "true" || value === "1"))
  );

const queryId = (label) => z.preprocess((value) => (value === "" ? undefined : value), r.requireId(label).optional());

const listOrders = {
  query: z
    .looseObject({
      status: z.preprocess(
        (value) => (value ? Number(value) : null),
        z.any().refine((status) => status === null || (status >= 1 && status <= 5), "Unknown status")
      ),
      paid: queryFlag("paid"),
      unpaid_only: queryFlag("unpaid_only"),
      customer_id: queryId("Customer"),
      vehicle_id: queryId("Car"),
    })
    .superRefine((q, ctx) => {
      if (q.unpaid_only === true && (q.paid === true || (q.status !== null && q.status !== 4))) {
        ctx.addIssue({
          code: "custom",
          path: ["unpaid_only"],
          message: "Unpaid (completed) only covers completed orders that aren't paid, so it can't be combined with Paid or another status",
        });
      }
    }),
};

export {
  NOTES, EDITABLE, isPastDate, orderId, createOrder, updateOrder, addLine, approval, assignTechnician, lineStatus,
  lineNote, listOrders,
};
