import { pool } from "../../../config/db.js";
import { PAYMENT_JOIN } from "../../../shared/payment-sql.js";
import { ApiError } from "../../../shared/respond.js";

const HASH_RE = /^[a-f0-9]{32}$/;
const METHOD_LABEL = { in_person: "in person", phone: "by phone" };

// FR-TRK-02, FR-TRK-03, FR-TRK-08: the customer's status page. Only safe fields:
// no email, phone, internal notes, technician names, other orders or money (prices are for signed-in staff only).
async function getOrderStatus(hash) {
  const notFound = new ApiError(404, "We couldn't find this order. Check the link in your email.");
  if (!HASH_RE.test(hash)) throw notFound;
  const [rows] = await pool.query(
    `SELECT o.order_id, o.status, cp.invoice_id IS NOT NULL AS paid, cp.paid_at, o.estimated_ready_date, o.completed_at, o.created_at,
       o.notes_for_customer,
       c.first_name, v.year, v.make, v.model, v.color, v.plate,
       g.name AS garage_name, g.phone AS garage_phone, g.address AS garage_address
     FROM orders o
     JOIN customers c ON c.customer_id = o.customer_id
     JOIN vehicles v ON v.vehicle_id = o.vehicle_id
     JOIN garage_settings g ON g.settings_id = 1
     ${PAYMENT_JOIN}
     WHERE o.order_hash = ?`,
    [hash]
  );
  if (!rows[0]) throw notFound;
  const order = rows[0];
  const [lines] = await pool.query(
    `SELECT l.service_name AS name, l.line_status, l.done_at
     FROM order_lines l
     WHERE l.order_id = ? ORDER BY l.line_id`,
    [order.order_id]
  );
  // The latest yes or no from the customer, for the timeline. Only the time and how (phone or in person).
  const [answers] = await pool.query(
    `SELECT approval_method, decided_at FROM order_approvals
     WHERE order_id = ? ORDER BY approval_id DESC LIMIT 1`,
    [order.order_id]
  );
  const answer = answers[0];
  return {
    ...order,
    answered_at: answer ? answer.decided_at : null,
    answer_method: answer ? METHOD_LABEL[answer.approval_method] : null,
    lines,
  };
}

export { getOrderStatus };
