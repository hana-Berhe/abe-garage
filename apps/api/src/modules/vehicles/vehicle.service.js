const { pool } = require("../../config/db");
const { ApiError } = require("../../shared/respond");
const { duplicateError } = require("../../shared/duplicate");
const { pageResult } = require("../../shared/pagination");

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
  // BE-020: 404 for a missing customer, 409 for a switched-off one.
  const [owner] = await pool.query("SELECT active FROM customers WHERE customer_id = ?", [vehicle.customer_id]);
  if (!owner[0]) throw new ApiError(404, "Customer not found", { field: "customer_id" });
  if (!owner[0].active) {
    throw new ApiError(409, "This customer is switched off. Switch them back on to add a car.", { field: "customer_id" });
  }
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

// BE-023: the odometer only goes up, so a lower mileage is a typing mistake (409).
function checkMileage(saved, next) {
  if (saved != null && next != null && next < saved) {
    throw new ApiError(409, `Mileage can't go lower than the saved ${saved.toLocaleString("en-US")} km`, { field: "mileage" });
  }
}

// BE-024: the car's orders, newest first, one page at a time, each with its jobs and their saved prices.
async function listOrders(id, { page, limit, offset }) {
  await getById(id);
  const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM orders WHERE vehicle_id = ?", [id]);
  const [orders] = await pool.query(
    `SELECT o.order_id, o.customer_id, CONCAT(c.first_name, ' ', c.last_name) AS customer_name, o.vehicle_id,
       o.status, o.paid, o.subtotal, o.vat_rate, o.vat_amount, o.total, o.created_at, o.estimated_ready_date, o.completed_at
     FROM orders o JOIN customers c ON c.customer_id = o.customer_id
     WHERE o.vehicle_id = ?
     ORDER BY o.created_at DESC, o.order_id DESC LIMIT ? OFFSET ?`,
    [id, limit, offset]
  );
  if (orders.length) {
    const [jobs] = await pool.query(
      `SELECT l.order_id, COALESCE(s.name, l.description) AS service_name, l.line_price
       FROM order_lines l LEFT JOIN services s ON s.service_id = l.service_id
       WHERE l.order_id IN (?) ORDER BY l.line_id`,
      [orders.map((o) => o.order_id)]
    );
    for (const o of orders) {
      o.jobs = jobs.filter((j) => j.order_id === o.order_id).map(({ service_name, line_price }) => ({ service_name, line_price }));
    }
  }
  return pageResult(orders, total, page, limit);
}

// FR-VEH-03. A car never moves to another customer, so customer_id is not editable.
async function update(id, v, updatedAt) {
  const current = await getById(id);
  checkMileage(current.mileage, v.mileage);
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

module.exports = { DUPLICATES, checkMileage, insert, create, listForCustomer, getById, getWithHistory, listOrders, update };
