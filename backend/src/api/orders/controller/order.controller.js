import * as orderService from "../service/order.service.js";
import { ok, created, badField, ApiError } from "../../../shared/respond.js";
import { readPage } from "../../../shared/pagination.js";
import { ORDER_STATUS } from "../../../shared/order-codes.js";
import { mergePatch } from "../../../shared/patch.js";
import { ROLES } from "../../../middlewares/auth.js";
import { NOTES, EDITABLE, isPastDate } from "../validations/order.validation.js";

// The routes check every field first (validations/order.validation.js).
const pickNotes = (source) => Object.fromEntries(NOTES.map((name) => [name, source[name]]));

async function create(req, res) {
  const { customer_id, vehicle_id, mileage, lines } = req.body;
  const data = { customer_id, vehicle_id, lines, mileage, ...pickNotes(req.body) };
  const order = await orderService.create(data, req.employee.id);
  return created(res, "Order created", order);
}

// BE-030: status, paid, customer_id, vehicle_id and unpaid_only (completed and not yet paid).
async function list(req, res) {
  const page = readPage(req.query);
  const { status, paid, unpaid_only: unpaidOnly } = req.query;
  const filters = {
    status: unpaidOnly ? ORDER_STATUS.COMPLETED : status,
    paid: unpaidOnly ? false : paid,
    customerId: req.query.customer_id ?? null,
    vehicleId: req.query.vehicle_id ?? null,
  };
  return ok(res, "Orders", await orderService.list({ ...page, ...filters }));
}

async function getOne(req, res) {
  const order = await orderService.getById(req.params.id);
  return ok(res, "Order", req.employee.role === ROLES.TECHNICIAN ? orderService.technicianView(order) : order);
}

async function estimate(req, res) {
  return ok(res, "Read printable estimate data successful", await orderService.getEstimate(req.params.id));
}

async function update(req, res) {
  const id = req.params.id;
  const current = await orderService.getById(id);
  const data = pickNotes(mergePatch(current, req.body, EDITABLE));
  // Only a changed date is checked, so an order whose date has passed can still get a new note.
  if (data.estimated_ready_date !== current.estimated_ready_date) {
    // BE-032: once completed the car is ready, so the date stays; notes can still change.
    if (current.status === ORDER_STATUS.COMPLETED) {
      throw new ApiError(409, "The order is completed, so its ready date can't change", { field: "estimated_ready_date" });
    }
    if (isPastDate(data.estimated_ready_date)) throw badField("estimated_ready_date", "The ready date can't be in the past");
  }
  if (req.body.lines !== undefined) data.lines = req.body.lines;
  return ok(res, "Order saved", await orderService.update(id, data, new Date(req.body.updated_at), req.employee.id));
}

async function addLine(req, res) {
  return created(res, "Job added. The order needs the customer's approval again.", await orderService.addLine(req.params.id, req.body, req.employee.id));
}

async function approval(req, res) {
  const { decision, method, note } = req.body;
  const order = await orderService.recordApproval(req.params.id, { decision, method, note }, req.employee.id);
  return ok(res, decision === "approve" ? "Approval recorded" : "Order declined", order);
}

async function assignTechnician(req, res) {
  return ok(res, "Technician saved", await orderService.assignTechnician(req.params.id, req.body.technician_id, req.employee.id));
}

async function lineStatus(req, res) {
  const change = {};
  if (req.body.status !== undefined) change.status = req.body.status;
  if (req.body.note !== undefined) change.note = req.body.note;
  return ok(res, "Job saved", await orderService.updateLineStatus(req.params.id, change, req.employee));
}

// BE-038
async function lineNote(req, res) {
  return ok(res, "Work note saved", await orderService.saveLineNote(req.params.id, req.body.technician_note, req.employee));
}

async function myJobs(req, res) {
  return ok(res, "My jobs", await orderService.myJobs(req.employee.id));
}

export { create, list, getOne, estimate, update, addLine, approval, assignTechnician, lineStatus, lineNote, myJobs };
