const { pool } = require("../config/db");
const { sendMail } = require("../utils/mailer");
const history = require("./history.service");

function statusLink(hash) {
  return `${(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "")}/order-status/${hash}`;
}

const MESSAGES = {
  created: (o, link) => ({
    subject: `Your ${o.make} ${o.model} at ${o.garage_name}: order #${o.order_id}`,
    text: `Hello ${o.first_name},\n\nWe have prepared the estimate for your ${o.make} ${o.model} (${o.plate}).\nFollow your car here: ${link}\n\n${o.garage_name}${o.garage_phone ? `, ${o.garage_phone}` : ""}`,
  }),
  completed: (o, link) => ({
    subject: `Your ${o.make} ${o.model} is ready`,
    text: `Hello ${o.first_name},\n\nGood news: your ${o.make} ${o.model} (${o.plate}) is ready for pickup.\nTotal: ${o.total} (VAT included). Details: ${link}\n\n${o.garage_name}${o.garage_phone ? `, ${o.garage_phone}` : ""}`,
  }),
};

// FR-TRK-05..07. Runs after the order is committed; a failure is logged in the history, never thrown (AD-7).
async function sendOrderEmail(orderId, kind, employeeId = null) {
  try {
    const [rows] = await pool.query(
      `SELECT o.order_id, o.order_hash, o.total, c.first_name, c.email, v.make, v.model, v.plate,
         g.name AS garage_name, g.phone AS garage_phone
       FROM orders o
       JOIN customers c ON c.customer_id = o.customer_id
       JOIN vehicles v ON v.vehicle_id = o.vehicle_id
       JOIN garage_settings g ON g.settings_id = 1
       WHERE o.order_id = ?`,
      [orderId]
    );
    const order = rows[0];
    if (!order) return false;
    const link = statusLink(order.order_hash);
    const sent = await sendMail({ to: order.email, ...MESSAGES[kind](order, link) });
    await history.add(pool, orderId, employeeId, sent ? "email_sent" : "email_failed", `${kind} email to ${order.email}`);
    return sent;
  } catch (err) {
    console.error("Order email error:", err.message);
    return false;
  }
}

module.exports = { sendOrderEmail, statusLink };
