import { pool, withTransaction } from "../../../config/db.js";
import { ApiError } from "../../../shared/respond.js";
import { ORDER_STATUS as S } from "../../../shared/order-codes.js";
import * as orderService from "../../orders/service/order.service.js";
import * as history from "../../orders/service/history.service.js";
import { PAYMENT_JOIN } from "../../../shared/payment-sql.js";

// FR-INV-06: INV- plus the order id, padded to 6 digits.
const invoiceNumber = (orderId) => `INV-${String(orderId).padStart(6, "0")}`;

// The invoice: the details frozen when it was issued (BE-040), the order's jobs and money (fixed once the order is
// completed), the total the customer approved, and the live payment (BE-041).
async function getInvoice(orderId) {
  const [rows] = await pool.query(
    `SELECT o.order_id, o.status, o.created_at, o.completed_at, o.subtotal, o.vat_rate, o.vat_amount, o.total,
       i.invoice_id, i.invoice_number, i.issued_at, i.garage_name, i.garage_address, i.garage_phone, i.garage_email,
       i.customer_first_name, i.customer_last_name, i.customer_email, i.customer_phone,
       i.vehicle_year, i.vehicle_make, i.vehicle_model, i.vehicle_type, i.vehicle_mileage, i.vehicle_plate,
       i.vehicle_vin, i.vehicle_color, i.notes_for_customer,
       CONCAT(ib.first_name, ' ', ib.last_name) AS invoice_issued_by_name,
       cp.invoice_id IS NOT NULL AS paid, cp.paid_at, CONCAT(pb.first_name, ' ', pb.last_name) AS paid_received_by_name
     FROM orders o
     ${PAYMENT_JOIN}
     LEFT JOIN employees ib ON ib.employee_id = i.issued_by
     LEFT JOIN employees pb ON pb.employee_id = cp.received_by
     WHERE o.order_id = ?`,
    [orderId]
  );
  const row = rows[0];
  if (!row) throw new ApiError(404, "Order not found");
  if (!row.invoice_id) {
    throw new ApiError(404, "The invoice has not been issued yet", { issued: false, can_issue: row.status === S.COMPLETED });
  }
  const [lines] = await pool.query(
    "SELECT line_id, service_name AS name, line_price FROM order_lines WHERE order_id = ? ORDER BY line_id",
    [orderId]
  );
  return {
    order_id: row.order_id,
    created_at: row.created_at,
    completed_at: row.completed_at,
    notes_for_customer: row.notes_for_customer,
    first_name: row.customer_first_name,
    last_name: row.customer_last_name,
    email: row.customer_email,
    phone: row.customer_phone,
    year: row.vehicle_year,
    make: row.vehicle_make,
    model: row.vehicle_model,
    type: row.vehicle_type,
    color: row.vehicle_color,
    mileage: row.vehicle_mileage,
    plate: row.vehicle_plate,
    vin: row.vehicle_vin,
    subtotal: row.subtotal,
    vat_rate: row.vat_rate,
    vat_amount: row.vat_amount,
    total: row.total,
    garage: { name: row.garage_name, address: row.garage_address, phone: row.garage_phone, email: row.garage_email },
    lines,
    approved_total: await history.lastApprovedTotal(pool, orderId),
    invoice_number: row.invoice_number,
    invoice_issued_at: row.issued_at,
    invoice_issued_by_name: row.invoice_issued_by_name,
    paid: row.paid,
    paid_at: row.paid_at,
    paid_received_by_name: row.paid_received_by_name,
  };
}

const findInvoice = async (conn, orderId) =>
  (await conn.query("SELECT invoice_id, invoice_number FROM invoices WHERE order_id = ?", [orderId]))[0][0];

// BE-040, FR-EST-06: only for completed orders whose total equals the last approved total.
// Issuing twice returns the same invoice; `created` tells the controller whether this call issued it.
async function issueInvoice(orderId, employeeId) {
  const created = await withTransaction(async (conn) => {
    const locked = await orderService.lockOrder(conn, orderId);
    if (await findInvoice(conn, orderId)) return false;
    if (locked.status !== S.COMPLETED) throw new ApiError(409, "The invoice can be issued once every job is done");
    const approved = await history.lastApprovedTotal(conn, orderId);
    if (approved !== locked.total) {
      throw new ApiError(
        409,
        `The order total ${locked.total} does not match the approved total ${approved ?? "(none)"}. Record the customer's approval of the new total first.`
      );
    }
    // Copies the garage, customer and car details as they are now, so later edits never change this invoice.
    const number = invoiceNumber(orderId);
    await conn.query(
      `INSERT INTO invoices (order_id, invoice_number, issued_by, issued_at, garage_name, garage_address, garage_phone,
         garage_email, customer_first_name, customer_last_name, customer_email, customer_phone, vehicle_year, vehicle_make,
         vehicle_model, vehicle_type, vehicle_mileage, vehicle_plate, vehicle_vin, vehicle_color, notes_for_customer)
       SELECT o.order_id, ?, ?, UTC_TIMESTAMP(), g.name, g.address, g.phone, g.email, c.first_name, c.last_name, c.email,
         c.phone, v.year, v.make, v.model, v.type, v.mileage, v.plate, v.vin, v.color, o.notes_for_customer
       FROM orders o
       JOIN customers c ON c.customer_id = o.customer_id
       JOIN vehicles v ON v.vehicle_id = o.vehicle_id
       JOIN garage_settings g ON g.settings_id = 1
       WHERE o.order_id = ?`,
      [number, employeeId, orderId]
    );
    await history.add(conn, orderId, employeeId, "invoice_issued", `${number} · total ${locked.total}`);
    return true;
  });
  return { created, invoice: await getInvoice(orderId) };
}

// FR-INV-02, FR-INV-07: the order row is locked first, so two clicks or two tabs record one payment (AT-13).
// BE-042: payment is recorded against an issued invoice, which only exists for a completed order.
async function markPaid(orderId, employeeId) {
  await withTransaction(async (conn) => {
    const order = await orderService.lockOrder(conn, orderId);
    const invoice = await findInvoice(conn, orderId);
    if (!invoice) throw new ApiError(409, "Issue the invoice before recording the payment");
    const [[paid]] = await conn.query("SELECT COUNT(*) AS n FROM cash_payments WHERE invoice_id = ?", [invoice.invoice_id]);
    if (paid.n > 0) throw new ApiError(409, "This order is already paid");
    await conn.query("INSERT INTO cash_payments (invoice_id, received_by, paid_at) VALUES (?, ?, UTC_TIMESTAMP())", [
      invoice.invoice_id,
      employeeId,
    ]);
    await history.add(conn, orderId, employeeId, "paid", `Cash ${order.total} · ${invoice.invoice_number}`);
  });
  return getInvoice(orderId);
}

export { getInvoice, issueInvoice, markPaid, invoiceNumber };
