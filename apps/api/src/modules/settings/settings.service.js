const { pool } = require("../../config/db");
const { ApiError } = require("../../shared/respond");

const COLUMNS = `name, address, phone, email, vat_rate,
  TIME_FORMAT(opening_time, '%H:%i') AS opening_time, TIME_FORMAT(closing_time, '%H:%i') AS closing_time, updated_at`;

async function get() {
  const [rows] = await pool.query(`SELECT ${COLUMNS} FROM garage_settings WHERE settings_id = 1`);
  if (!rows[0]) throw new ApiError(500, "Garage settings are missing. Run /install.");
  return rows[0];
}

// Safe fields for the public website (NFR-05).
async function getPublic() {
  const { name, address, phone, email, opening_time, closing_time } = await get();
  return { name, address, phone, email, opening_time, closing_time };
}

// The new VAT rate applies to new orders only; each order keeps its own copy (AD-6).
async function update(data) {
  const [result] = await pool.query(
    `UPDATE garage_settings SET name = ?, address = ?, phone = ?, email = ?, vat_rate = ?, opening_time = ?, closing_time = ?
     WHERE settings_id = 1 AND updated_at = ?`,
    [data.name, data.address, data.phone, data.email, data.vat_rate, data.opening_time, data.closing_time, data.updated_at]
  );
  if (result.affectedRows === 0) {
    throw new ApiError(409, "Someone else changed the settings since you opened them. Reload to see their changes.");
  }
  return get();
}

module.exports = { get, getPublic, update };
