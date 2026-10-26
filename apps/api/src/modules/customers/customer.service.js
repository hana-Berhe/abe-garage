const { pool, withTransaction } = require("../../config/db");
const { ApiError } = require("../../shared/respond");
const { pageResult } = require("../../shared/pagination");
const { duplicateError } = require("../../shared/duplicate");
const vehicleService = require("../vehicles/vehicle.service");

const DUPLICATES = {
  uq_customers_email: ["email", "Email already used by another customer"],
  uq_customers_phone: ["phone", "Phone already used by another customer"],
};

const COLUMNS = "c.customer_id, c.first_name, c.last_name, c.email, c.phone, c.active, c.created_at, c.updated_at";

// FR-CUS-01, FR-CUS-02. A first car may be saved with the customer, in one transaction (NFR-06).
async function create(customer, vehicle) {
  try {
    const customerId = await withTransaction(async (conn) => {
      const [result] = await conn.query(
        "INSERT INTO customers (first_name, last_name, email, phone, active) VALUES (?, ?, ?, ?, ?)",
        [customer.first_name, customer.last_name, customer.email, customer.phone, customer.active]
      );
      if (vehicle) await vehicleService.insert(conn, { ...vehicle, customer_id: result.insertId });
      return result.insertId;
    });
    return getById(customerId);
  } catch (err) {
    // A car sent with the customer reports its fields as "vehicle.plate", like the form names them.
    const carKeys = Object.fromEntries(
      Object.entries(vehicleService.DUPLICATES).map(([index, [field, message]]) => [index, [`vehicle.${field}`, message]])
    );
    throw duplicateError(err, { ...DUPLICATES, ...carKeys });
  }
}

// FR-CUS-03: search by name, email, phone or plate.
async function list({ page, search, limit, offset, activeOnly }) {
  const where = [];
  const params = [];
  if (search) {
    const like = `%${search}%`;
    where.push(`(c.first_name LIKE ? OR c.last_name LIKE ? OR CONCAT(c.first_name, ' ', c.last_name) LIKE ?
      OR c.email LIKE ? OR c.phone LIKE ?
      OR EXISTS (SELECT 1 FROM vehicles v WHERE v.customer_id = c.customer_id AND v.plate LIKE ?))`);
    params.push(like, like, like, like, like, like);
  }
  if (activeOnly) where.push("c.active = 1");
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM customers c ${whereSql}`, params);
  const [rows] = await pool.query(
    `SELECT ${COLUMNS},
       (SELECT COUNT(*) FROM vehicles v WHERE v.customer_id = c.customer_id) AS vehicle_count
     FROM customers c ${whereSql}
     ORDER BY c.created_at DESC, c.customer_id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return pageResult(rows, total, page, limit);
}

async function getById(id) {
  const [rows] = await pool.query(`SELECT ${COLUMNS} FROM customers c WHERE c.customer_id = ?`, [id]);
  if (!rows[0]) throw new ApiError(404, "Customer not found");
  return rows[0];
}

// FR-CUS-05: details, cars, orders and the unpaid total.
async function getProfile(id) {
  const customer = await getById(id);
  const vehicles = await vehicleService.listForCustomer(id);
  const [orders] = await pool.query(
    `SELECT o.order_id, o.status, o.paid, o.total, o.created_at, o.completed_at, v.plate, v.make, v.model
     FROM orders o JOIN vehicles v ON v.vehicle_id = o.vehicle_id
     WHERE o.customer_id = ? ORDER BY o.created_at DESC, o.order_id DESC`,
    [id]
  );
  const [[owed]] = await pool.query(
    "SELECT COALESCE(SUM(total), 0) AS unpaid_total FROM orders WHERE customer_id = ? AND status = 4 AND paid = 0",
    [id]
  );
  return { ...customer, vehicles, orders, unpaid_total: owed.unpaid_total };
}

// FR-CUS-04, NFR-16
async function update(id, customer, updatedAt) {
  const current = await getById(id);
  let result;
  try {
    [result] = await pool.query(
      `UPDATE customers SET first_name = ?, last_name = ?, email = ?, phone = ?, active = ?
       WHERE customer_id = ? AND updated_at = ?`,
      [customer.first_name, customer.last_name, customer.email, customer.phone, customer.active, id, updatedAt]
    );
  } catch (err) {
    throw duplicateError(err, DUPLICATES);
  }
  if (result.affectedRows === 0) {
    throw new ApiError(409, "Someone else changed this customer since you opened it. Reload to see their changes.", {
      current,
    });
  }
  return getById(id);
}

module.exports = { create, list, getById, getProfile, update };
