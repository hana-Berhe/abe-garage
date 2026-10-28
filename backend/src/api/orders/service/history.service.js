// order_history: who did what, when. employeeId is null when the system acts.
async function add(conn, orderId, employeeId, action, details = null) {
  await conn.query("INSERT INTO order_history (order_id, employee_id, action, details) VALUES (?, ?, ?, ?)", [
    orderId,
    employeeId,
    action,
    details ? String(details).slice(0, 255) : null,
  ]);
}

async function listForOrder(conn, orderId) {
  const [rows] = await conn.query(
    `SELECT h.history_id, h.action, h.details, h.created_at, h.employee_id,
       CONCAT(e.first_name, ' ', e.last_name) AS employee_name
     FROM order_history h LEFT JOIN employees e ON e.employee_id = h.employee_id
     WHERE h.order_id = ? ORDER BY h.created_at DESC, h.history_id DESC`,
    [orderId]
  );
  return rows;
}

// FR-EST-06: the total the customer last said yes to.
async function lastApprovedTotal(conn, orderId) {
  const [rows] = await conn.query(
    `SELECT order_total FROM order_approvals WHERE order_id = ? AND decision = 'approved'
     ORDER BY approval_id DESC LIMIT 1`,
    [orderId]
  );
  return rows[0] ? rows[0].order_total : null;
}

export { add, listForOrder, lastApprovedTotal };
