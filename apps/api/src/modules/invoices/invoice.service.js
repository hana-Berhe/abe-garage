const { pool, withTransaction } = require("../../config/db");
const { ApiError } = require("../../shared/respond");
const { ORDER_STATUS: S } = require("../../shared/order-codes");
const orderService = require("../orders/order.service");
const history = require("../orders/history.service");

// FR-INV-06: INV- plus the order id, padded to 6 digits.
const invoiceNumber = (orderId) => `INV-${String(orderId).padStart(6, "0")}`;

// What a printed invoice shows. Copied once when the invoice is issued and never rebuilt (BE-040),
// so later changes to services, customers, cars or garage settings cannot change it.
const ORDER_FIELDS = [
  "order_id", "created_at", "completed_at", "notes_for_customer",
  "first_name", "last_name", "email", "phone",
  "year", "make", "model", "type", "color", "mileage", "plate", "vin",
  "subtotal", "vat_rate", "vat_amount", "total",
];

function makeSnapshot(order, approvedTotal) {
  const snapshot = Object.fromEntries(ORDER_FIELDS.map((f) => [f, order[f] ?? null]));
  snapshot.garage = { name: order.garage.name, address: order.garage.address, phone: order.garage.phone, email: order.garage.email };
  snapshot.lines = order.lines.map((l) => ({ line_id: l.line_id, name: l.name, line_price: l.line_price }));
  snapshot.approved_total = approvedTotal;
  return snapshot;
}

const readSnapshot = (value) => (typeof value === "string" ? JSON.parse(value) : value);

// The stored invoice plus live payment details, which are not part of the frozen copy (BE-041).
async function getInvoice(orderId) {
  const [rows] = await pool.query(
    `SELECT o.order_id, o.status, o.invoice_number, o.invoice_issued_at, o.invoice_snapshot,
       o.paid, o.paid_at, CONCAT(pb.first_name, ' ', pb.last_name) AS paid_received_by_name,
       CONCAT(ib.first_name, ' ', ib.last_name) AS invoice_issued_by_name
     FROM orders o
     LEFT JOIN employees pb ON pb.employee_id = o.paid_received_by
     LEFT JOIN employees ib ON ib.employee_id = o.invoice_issued_by
     WHERE o.order_id = ?`,
    [orderId]
  );
  const row = rows[0];
  if (!row) throw new ApiError(404, "Order not found");
  if (!row.invoice_number) {
    throw new ApiError(404, "The invoice has not been issued yet", { issued: false, can_issue: row.status === S.COMPLETED });
  }
  return {
    ...readSnapshot(row.invoice_snapshot),
    invoice_number: row.invoice_number,
    invoice_issued_at: row.invoice_issued_at,
    invoice_issued_by_name: row.invoice_issued_by_name,
    paid: row.paid,
    paid_at: row.paid_at,
    paid_received_by_name: row.paid_received_by_name,
  };
}

// BE-040, FR-EST-06: only for completed orders whose total equals the last approved total.
// Issuing twice returns the same invoice; `created` tells the controller whether this call issued it.
async function issueInvoice(orderId, employeeId) {
  const created = await withTransaction(async (conn) => {
    const locked = await orderService.lockOrder(conn, orderId);
    if (locked.invoice_number) return false;
    if (locked.status !== S.COMPLETED) throw new ApiError(409, "The invoice can be issued once every job is done");
    const approved = await history.lastApprovedTotal(conn, orderId);
    if (approved !== locked.total) {
      throw new ApiError(
        409,
        `The order total ${locked.total} does not match the approved total ${approved ?? "(none)"}. Record the customer's approval of the new total first.`
      );
    }
    // Jobs and prices cannot change while the order row is locked, since every order change locks it first.
    const order = await orderService.getById(orderId);
    const number = invoiceNumber(orderId);
    await conn.query(
      `UPDATE orders SET invoice_number = ?, invoice_issued_at = UTC_TIMESTAMP(), invoice_issued_by = ?, invoice_snapshot = ?
       WHERE order_id = ?`,
      [number, employeeId, JSON.stringify(makeSnapshot(order, approved)), orderId]
    );
    await history.add(conn, orderId, employeeId, "invoice_issued", `${number} · total ${locked.total}`);
    return true;
  });
  return { created, invoice: await getInvoice(orderId) };
}

// FR-INV-02, FR-INV-07: one guarded update, so two clicks or two tabs record one payment (AT-13).
// BE-042: payment is recorded against an issued invoice.
async function markPaid(orderId, employeeId) {
  await withTransaction(async (conn) => {
    const order = await orderService.lockOrder(conn, orderId);
    if (!order.invoice_number) throw new ApiError(409, "Issue the invoice before recording the payment");
    const [result] = await conn.query(
      `UPDATE orders SET paid = 1, paid_at = UTC_TIMESTAMP(), paid_received_by = ?
       WHERE order_id = ? AND status = ? AND paid = 0`,
      [employeeId, orderId, S.COMPLETED]
    );
    if (result.affectedRows === 0) throw new ApiError(409, "This order is already paid");
    await history.add(conn, orderId, employeeId, "paid", `Cash ${order.total} · ${order.invoice_number}`);
  });
  return getInvoice(orderId);
}

module.exports = { getInvoice, issueInvoice, markPaid, invoiceNumber };
