const { pool } = require("../../config/db");
const { ApiError } = require("../../shared/respond");
const { pageResult } = require("../../shared/pagination");

// Stops one phone number from filling the list: at most 5 new requests per hour.
const MAX_PER_HOUR = 5;

async function create(data) {
  const [[{ recent }]] = await pool.query(
    "SELECT COUNT(*) AS recent FROM callback_requests WHERE phone = ? AND created_at >= NOW() - INTERVAL 1 HOUR",
    [data.phone]
  );
  if (recent >= MAX_PER_HOUR) throw new ApiError(429, "We already have your request. We will call you soon.");
  if (data.service_id) {
    const [rows] = await pool.query("SELECT service_id FROM services WHERE service_id = ? AND active = 1", [data.service_id]);
    if (!rows[0]) data.service_id = null; // a service removed since the page loaded counts as "Not sure"
  }
  const [result] = await pool.query(
    `INSERT INTO callback_requests (full_name, phone, car, service_id, problem, best_time)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.full_name, data.phone, data.car, data.service_id, data.problem, data.best_time]
  );
  return { callback_id: result.insertId };
}

// status: "new", "called" or "all". New ones first, newest first.
async function list({ status = "new", page, limit, offset }) {
  const where = status === "new" ? "WHERE r.status = 0" : status === "called" ? "WHERE r.status = 1" : "";
  const [rows] = await pool.query(
    `SELECT r.callback_id, r.full_name, r.phone, r.car, r.problem, r.best_time, r.status, r.called_at, r.created_at,
       s.name AS service_name, CONCAT(e.first_name, ' ', e.last_name) AS called_by_name
     FROM callback_requests r
     LEFT JOIN services s ON s.service_id = r.service_id
     LEFT JOIN employees e ON e.employee_id = r.called_by
     ${where}
     ORDER BY r.status ASC, r.created_at DESC, r.callback_id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM callback_requests r ${where}`);
  return { ...pageResult(rows, total, page, limit), new_count: await countNew() };
}

async function countNew() {
  const [[{ n }]] = await pool.query("SELECT COUNT(*) AS n FROM callback_requests WHERE status = 0");
  return Number(n);
}

// One guarded update, so two people pressing "Mark as called" at once get a clear answer.
async function markCalled(id, employeeId) {
  const [result] = await pool.query(
    "UPDATE callback_requests SET status = 1, called_by = ?, called_at = NOW() WHERE callback_id = ? AND status = 0",
    [employeeId, id]
  );
  if (result.affectedRows === 0) {
    const [rows] = await pool.query("SELECT status FROM callback_requests WHERE callback_id = ?", [id]);
    if (!rows[0]) throw new ApiError(404, "Call-back request not found");
    throw new ApiError(409, "Someone already marked this as called");
  }
  return { callback_id: id, status: 1 };
}

module.exports = { create, list, countNew, markCalled };
