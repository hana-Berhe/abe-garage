const { pool } = require("../../config/db");
const { ApiError } = require("../../shared/respond");
const { duplicateError } = require("../../shared/duplicate");

const DUPLICATES = {
  uq_vehicles_plate: ["plate", "This plate number is already registered"],
};

const COLUMNS = `v.vehicle_id, v.customer_id, v.year, v.make, v.model, v.type, v.mileage, v.plate, v.vin, v.color,
  v.created_at, v.updated_at`;

// Used inside the customer transaction too, so it takes a connection.
async function insert(conn, v) {
  const [result] = await conn.query(
    `INSERT INTO vehicles (customer_id, year, make, model, type, mileage, plate, vin, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [v.customer_id, v.year, v.make, v.model, v.type, v.mileage, v.plate, v.vin, v.color]
  );
  return result.insertId;
}

// FR-VEH-01, FR-VEH-02
async function create(vehicle) {
  const [owner] = await pool.query("SELECT customer_id FROM customers WHERE customer_id = ?", [vehicle.customer_id]);
  if (!owner[0]) throw new ApiError(400, "Customer not found", { field: "customer_id" });
  try {
    const id = await insert(pool, vehicle);
    return getById(id);
  } catch (err) {
    throw duplicateError(err, DUPLICATES);
  }
}

async function listForCustomer(customerId) {
  const [rows] = await pool.query(`SELECT ${COLUMNS} FROM vehicles v WHERE v.customer_id = ? ORDER BY v.created_at`, [
    customerId,
  ]);
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query(
    `SELECT ${COLUMNS}, c.first_name AS customer_first_name, c.last_name AS customer_last_name
     FROM vehicles v JOIN customers c ON c.customer_id = v.customer_id WHERE v.vehicle_id = ?`,
    [id]
  );
  if (!rows[0]) throw new ApiError(404, "Car not found");
  return rows[0];
}

// FR-VEH-04: every past order with date, jobs and total.
async function getWithHistory(id) {
  const vehicle = await getById(id);
  const [orders] = await pool.query(
    `SELECT o.order_id, o.status, o.paid, o.total, o.created_at, o.completed_at,
       GROUP_CONCAT(COALESCE(s.name, l.description) ORDER BY l.line_id SEPARATOR ', ') AS jobs
     FROM orders o
     LEFT JOIN order_lines l ON l.order_id = o.order_id
     LEFT JOIN services s ON s.service_id = l.service_id
     WHERE o.vehicle_id = ?
     GROUP BY o.order_id
     ORDER BY o.created_at DESC, o.order_id DESC`,
    [id]
  );
  return { ...vehicle, orders };
}

// FR-VEH-03. A car never moves to another customer, so customer_id is not editable.
async function update(id, v, updatedAt) {
  const current = await getById(id);
  let result;
  try {
    [result] = await pool.query(
      `UPDATE vehicles SET year = ?, make = ?, model = ?, type = ?, mileage = ?, plate = ?, vin = ?, color = ?
       WHERE vehicle_id = ? AND updated_at = ?`,
      [v.year, v.make, v.model, v.type, v.mileage, v.plate, v.vin, v.color, id, updatedAt]
    );
  } catch (err) {
    throw duplicateError(err, DUPLICATES);
  }
  if (result.affectedRows === 0) {
    throw new ApiError(409, "Someone else changed this car since you opened it. Reload to see their changes.", {
      current,
    });
  }
  return getById(id);
}

module.exports = { DUPLICATES, insert, create, listForCustomer, getById, getWithHistory, update };
