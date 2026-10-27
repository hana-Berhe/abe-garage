const invoiceService = require("./invoice.service");
const notification = require("../orders/notification.service");
const orderService = require("../orders/order.service");
const { ok, created, badField } = require("../../shared/respond");
const { ORDER_STATUS: S } = require("../../shared/order-codes");
const v = require("../../shared/validate");

async function getInvoice(req, res) {
  const id = v.requireId(req.params.id, "id", "Order id");
  return ok(res, "Invoice", await invoiceService.getInvoice(id));
}

// BE-040: 201 when this call issues the invoice, 200 with the same invoice when it was issued before.
async function issue(req, res) {
  const id = v.requireId(req.params.id, "id", "Order id");
  const result = await invoiceService.issueInvoice(id, req.employee.id);
  return result.created ? created(res, "Invoice issued", result.invoice) : ok(res, "Invoice already issued", result.invoice);
}

// BE-042: the body may be { "paid": true } (or empty). Nothing else: no partial payment or undo.
async function markPaid(req, res) {
  const id = v.requireId(req.params.id, "id", "Order id");
  if (req.body.paid !== undefined && req.body.paid !== true) throw badField("paid", "Only paid: true can be recorded");
  return ok(res, "Paid in cash", await invoiceService.markPaid(id, req.employee.id));
}

// FR-TRK-07: the status link again, or the "car is ready" email once completed.
async function resendEmail(req, res) {
  const id = v.requireId(req.params.id, "id", "Order id");
  const order = await orderService.getById(id);
  const sent = await notification.sendOrderEmail(id, order.status === S.COMPLETED ? "completed" : "created", req.employee.id);
  return ok(res, sent ? "Email sent" : "The email could not be sent. Check the SMTP settings or use Copy link.", { sent });
}

module.exports = { getInvoice, issue, markPaid, resendEmail };
