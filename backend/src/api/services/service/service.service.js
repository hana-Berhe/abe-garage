import { pool } from "../../../config/db.js";
import { ApiError } from "../../../shared/respond.js";
import { duplicateError } from "../../../shared/duplicate.js";

const DUPLICATES = { uq_services_name: ["name", "A service with this name already exists"] };
const COLUMNS = "service_id, name, description, price, labor_hours, active, created_at, updated_at";

// FR-SRV-01
async function create(s) {
  try {
    const [result] = await pool.query(
      "INSERT INTO services (name, description, price, labor_hours, active) VALUES (?, ?, ?, ?, ?)",
      [s.name, s.description, s.price, s.labor_hours, s.active]
    );
    return getById(result.insertId);
  } catch (err) {
    throw duplicateError(err, DUPLICATES);
  }
}

// All services, including inactive ones, for staff pages.
async function listAll() {
  const [rows] = await pool.query(`SELECT ${COLUMNS} FROM services ORDER BY active DESC, name`);
  return rows;
}

// FR-SRV-04, NFR-05: only safe fields of active services.
// The public website lists services without prices: prices are for signed-in staff only.
async function listPublic() {
  const [rows] = await pool.query(
    "SELECT service_id, name, description, labor_hours FROM services WHERE active = 1 ORDER BY name"
  );
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query(`SELECT ${COLUMNS} FROM services WHERE service_id = ?`, [id]);
  if (!rows[0]) throw new ApiError(404, "Service not found");
  return rows[0];
}

// Active services by id, read inside the order transaction so prices are copied as they are now.
async function getActiveByIds(conn, ids) {
  if (!ids.length) return [];
  const [rows] = await conn.query(
    "SELECT service_id, name, description, price, labor_hours FROM services WHERE active = 1 AND service_id IN (?)",
    [ids]
  );
  return rows;
}

// FR-SRV-02, FR-SRV-03. Old orders keep their copied prices (AD-6).
async function update(id, s, updatedAt) {
  const current = await getById(id);
  let result;
  try {
    [result] = await pool.query(
      `UPDATE services SET name = ?, description = ?, price = ?, labor_hours = ?, active = ?
       WHERE service_id = ? AND updated_at = ?`,
      [s.name, s.description, s.price, s.labor_hours, s.active, id, updatedAt]
    );
  } catch (err) {
    throw duplicateError(err, DUPLICATES);
  }
  if (result.affectedRows === 0) {
    throw new ApiError(409, "Someone else changed this service since you opened it. Reload to see their changes.", {
      current,
    });
  }
  return getById(id);
}

export { create, listAll, listPublic, getById, getActiveByIds, update };
