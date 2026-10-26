const { pool } = require("../../config/db");
const { ApiError } = require("../../shared/respond");

const HASH_RE = /^[a-f0-9]{32}$/;

// FR-TRK-02, FR-TRK-03, FR-TRK-08: the customer's status page. Only safe fields:
// no email, phone, internal notes, technician names or other orders.
async function getOrderStatus(hash) {
  const notFound = new ApiError(404, "We couldn't find this order. Check the link in your email.");
  if (!HASH_RE.test(hash)) throw notFound;
  const [rows] = await pool.query(
    `SELECT o.order_id, o.status, o.paid, o.paid_at, o.estimated_ready_date, o.completed_at, o.created_at,
       o.notes_for_customer, o.subtotal, o.vat_rate, o.vat_amount, o.total,
       c.first_name, v.year, v.make, v.model, v.plate,
       g.name AS garage_name, g.phone AS garage_phone, g.address AS garage_address
     FROM orders o
     JOIN customers c ON c.customer_id = o.customer_id
     JOIN vehicles v ON v.vehicle_id = o.vehicle_id
     JOIN garage_settings g ON g.settings_id = 1
     WHERE o.order_hash = ?`,
    [hash]
  );
  if (!rows[0]) throw notFound;
  const order = rows[0];
  const [lines] = await pool.query(
    `SELECT COALESCE(s.name, l.description) AS name, l.line_price, l.line_status, l.done_at
     FROM order_lines l LEFT JOIN services s ON s.service_id = l.service_id
     WHERE l.order_id = ? ORDER BY l.line_id`,
    [order.order_id]
  );
  return { ...order, lines };
}

module.exports = { getOrderStatus };
