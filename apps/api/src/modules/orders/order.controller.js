const orderService = require("./order.service");
const { ok, created, badField } = require("../../shared/respond");
const { readPage } = require("../../shared/pagination");
const { readUpdatedAt } = require("../../shared/stale-check");
const { APPROVAL_METHODS } = require("../../shared/order-codes");
const v = require("../../shared/validate");
const { mergePatch } = require("../../shared/patch");
const { readLine, readLines, readNotes } = require("./order.validator");

const EDITABLE = ["estimated_ready_date", "notes_for_customer", "internal_notes", "lines"];

async function create(req, res) {
  let mileage = null;
  if (req.body.mileage !== undefined && req.body.mileage !== null && req.body.mileage !== "") {
    mileage = Number(req.body.mileage);
    if (!Number.isInteger(mileage) || mileage < 0) throw badField("mileage", "Mileage must be a whole number");
  }
  const data = {
    customer_id: v.requireId(req.body.customer_id, "customer_id", "Customer"),
    vehicle_id: v.requireId(req.body.vehicle_id, "vehicle_id", "Car"),
    lines: readLines(req.body),
    mileage,
    ...readNotes(req.body),
  };
  const order = await orderService.create(data, req.employee.id);
  return created(res, "Order created", order);
}

async function list(req, res) {
  const page = readPage(req.query);
  const status = req.query.status ? Number(req.query.status) : null;
  if (status !== null && !(status >= 1 && status <= 5)) throw badField("status", "Unknown status");
  const paid = req.query.paid === "1" ? true : req.query.paid === "0" ? false : null;
  return ok(res, "Orders", await orderService.list({ ...page, status, paid }));
}

async function getOne(req, res) {
  const id = v.requireId(req.params.id, "id", "Order id");
  const order = await orderService.getById(id);
  return ok(res, "Order", order);
}

async function estimate(req, res) {
  const id = v.requireId(req.params.id, "id", "Order id");
  return ok(res, "Read printable estimate data successful", await orderService.getEstimate(id));
}

async function update(req, res) {
  const id = v.requireId(req.params.id, "id", "Order id");
  const merged = mergePatch(await orderService.getById(id), req.body, EDITABLE);
  const data = readNotes(merged);
  if (req.body.lines !== undefined) data.lines = readLines(req.body, { allowEmpty: true });
  return ok(res, "Order saved", await orderService.update(id, data, readUpdatedAt(req.body), req.employee.id));
}

async function addLine(req, res) {
  const id = v.requireId(req.params.id, "id", "Order id");
  const line = readLine(req.body, "line");
  return created(res, "Job added. The order needs the customer's approval again.", await orderService.addLine(id, line, req.employee.id));
}

async function approval(req, res) {
  const id = v.requireId(req.params.id, "id", "Order id");
  const decision = req.body.decision;
  if (decision !== "approve" && decision !== "decline") throw badField("decision", "Choose approve or decline");
  if (!APPROVAL_METHODS.includes(req.body.method)) throw badField("method", "Choose in person or by phone");
  const note = v.optionalText(req.body, "note", "Note", 150);
  const order = await orderService.recordApproval(id, { decision, method: req.body.method, note }, req.employee.id);
  return ok(res, decision === "approve" ? "Approval recorded" : "Order declined", order);
}

async function assignTechnician(req, res) {
  const lineId = v.requireId(req.params.id, "id", "Job id");
  const technicianId = req.body.technician_id ? v.requireId(req.body.technician_id, "technician_id", "Technician") : null;
  return ok(res, "Technician saved", await orderService.assignTechnician(lineId, technicianId, req.employee.id));
}

async function lineStatus(req, res) {
  const lineId = v.requireId(req.params.id, "id", "Job id");
  const change = {};
  if (req.body.status !== undefined) {
    change.status = Number(req.body.status);
    if (![1, 2].includes(change.status)) throw badField("status", "Status must be 1 (Started) or 2 (Done)");
  }
  if (req.body.note !== undefined) change.note = v.optionalText(req.body, "note", "Work note", 2000);
  if (change.status === undefined && change.note === undefined) throw badField("status", "Nothing to change");
  return ok(res, "Job saved", await orderService.updateLineStatus(lineId, change, req.employee));
}

async function myJobs(req, res) {
  return ok(res, "My jobs", await orderService.myJobs(req.employee.id));
}

module.exports = { create, list, getOne, estimate, update, addLine, approval, assignTechnician, lineStatus, myJobs };
