import * as invoiceService from "../service/invoice.service.js";
import * as notification from "../../orders/service/notification.service.js";
import * as orderService from "../../orders/service/order.service.js";
import { ok, created, badField } from "../../../shared/respond.js";
import { ORDER_STATUS as S } from "../../../shared/order-codes.js";
import * as v from "../../../shared/validate.js";

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

export { getInvoice, issue, markPaid, resendEmail };
