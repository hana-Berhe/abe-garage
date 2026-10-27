import { pool } from "../../../config/db.js";
import { periodStarts } from "../../../shared/time.js";

// FR-DSH-02, FR-DSH-03, FR-INV-04. Numbers match the order list filters.
async function getCounters() {
  const { today, week, month } = periodStarts();
  const [[row]] = await pool.query(
    `SELECT
       SUM(status = 1) AS awaiting_approval,
       SUM(status = 2) AS approved,
       SUM(status = 3) AS in_progress,
       SUM(status = 4 AND completed_at >= ?) AS completed_today,
       SUM(status = 4 AND paid = 0) AS unpaid,
       COALESCE(SUM(CASE WHEN status = 4 AND paid = 0 THEN total END), 0) AS unpaid_total,
       COALESCE(SUM(CASE WHEN paid = 1 AND paid_at >= ? THEN total END), 0) AS money_today,
       COALESCE(SUM(CASE WHEN paid = 1 AND paid_at >= ? THEN total END), 0) AS money_week,
       COALESCE(SUM(CASE WHEN paid = 1 AND paid_at >= ? THEN total END), 0) AS money_month
     FROM orders`,
    [today, today, week, month]
  );
  const counters = Object.fromEntries(
    Object.entries(row).map(([k, val]) => [k, k.startsWith("money") || k === "unpaid_total" ? Number(val).toFixed(2) : Number(val || 0)])
  );
  const [recent] = await pool.query(
    `SELECT o.order_id, o.status, o.paid, o.total, o.created_at, c.first_name, c.last_name, v.make, v.model, v.plate
     FROM orders o JOIN customers c ON c.customer_id = o.customer_id JOIN vehicles v ON v.vehicle_id = o.vehicle_id
     WHERE o.status IN (1, 2, 3) OR (o.status = 4 AND o.paid = 0)
     ORDER BY o.status = 1 DESC, o.created_at DESC LIMIT 8`
  );
  return {
    ...counters,
    needs_attention: recent,
    timezone: process.env.APP_TIMEZONE || "UTC",
  };
}

export { getCounters };
