const { pool } = require("../../config/db");
const { ApiError } = require("../../shared/respond");
const { ORDER_STATUS: S } = require("../../shared/order-codes");
const orderService = require("../orders/order.service");
const history = require("../orders/history.service");

// FR-INV-06: INV- plus the order id, padded to 6 digits. No column needed.
const invoiceNumber = (orderId) => `INV-${String(orderId).padStart(6, "0")}`;

// FR-INV-01, FR-EST-06: only for completed orders, and only when the total equals the last approved total.
async function getInvoice(orderId) {
  const order = await orderService.getById(orderId);
  if (order.status !== S.COMPLETED) throw new ApiError(400, "The invoice opens once every job is done");
  const approved = await history.lastApprovedTotal(pool, orderId);
  if (approved !== order.total) {
    throw new ApiError(
      409,
      `The order total ${order.total} does not match the approved total ${approved ?? "(none)"}. Record the customer's approval of the new total first.`
    );
  }
  return { ...order, invoice_number: invoiceNumber(orderId), approved_total: approved };
}

// FR-INV-02, FR-INV-07: one guarded update, so two clicks or two tabs record one payment (AT-13).
async function markPaid(orderId, employeeId) {
  await getInvoice(orderId);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `UPDATE orders SET paid = 1, paid_at = UTC_TIMESTAMP(), paid_received_by = ?
       WHERE order_id = ? AND status = ? AND paid = 0`,
      [employeeId, orderId, S.COMPLETED]
    );
    if (result.affectedRows === 0) {
      await conn.rollback();
      throw new ApiError(409, "This order is already paid");
    }
    const [[order]] = await conn.query("SELECT total FROM orders WHERE order_id = ?", [orderId]);
    await history.add(conn, orderId, employeeId, "paid", `Cash ${order.total} · ${invoiceNumber(orderId)}`);
    await conn.commit();
  } catch (err) {
    if (!(err instanceof ApiError)) await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return getInvoice(orderId);
}

module.exports = { getInvoice, markPaid, invoiceNumber };
