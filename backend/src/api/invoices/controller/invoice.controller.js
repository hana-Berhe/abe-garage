import * as invoiceService from "../service/invoice.service.js";
import * as notification from "../../orders/service/notification.service.js";
import * as orderService from "../../orders/service/order.service.js";
import { ok, created } from "../../../shared/respond.js";
import { ORDER_STATUS as S } from "../../../shared/order-codes.js";

async function getInvoice(req, res) {
  return ok(res, "Invoice", await invoiceService.getInvoice(req.params.id));
}

// BE-040: 201 when this call issues the invoice, 200 with the same invoice when it was issued before.
async function issue(req, res) {
  const result = await invoiceService.issueInvoice(req.params.id, req.employee.id);
  return result.created ? created(res, "Invoice issued", result.invoice) : ok(res, "Invoice already issued", result.invoice);
}

// BE-042: the route only lets { "paid": true } or an empty body through.
async function markPaid(req, res) {
  return ok(res, "Paid in cash", await invoiceService.markPaid(req.params.id, req.employee.id));
}

// FR-TRK-07: the status link again, or the "car is ready" email once completed.
async function resendEmail(req, res) {
  const id = req.params.id;
  const order = await orderService.getById(id);
  const sent = await notification.sendOrderEmail(id, order.status === S.COMPLETED ? "completed" : "created", req.employee.id);
  return ok(res, sent ? "Email sent" : "The email could not be sent. Check the SMTP settings or use Copy link.", { sent });
}

export { getInvoice, issue, markPaid, resendEmail };
