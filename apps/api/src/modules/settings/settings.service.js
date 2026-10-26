const { pool } = require("../../config/db");
const { ApiError } = require("../../shared/respond");

async function get() {
  const [rows] = await pool.query(
    "SELECT name, address, phone, email, vat_rate, updated_at FROM garage_settings WHERE settings_id = 1"
  );
  if (!rows[0]) throw new ApiError(500, "Garage settings are missing. Run /install.");
  return rows[0];
}

// The new VAT rate applies to new orders only; each order keeps its own copy (AD-6).
async function update(data) {
  const [result] = await pool.query(
    `UPDATE garage_settings SET name = ?, address = ?, phone = ?, email = ?, vat_rate = ?
     WHERE settings_id = 1 AND updated_at = ?`,
    [data.name, data.address, data.phone, data.email, data.vat_rate, new Date(data.updated_at)]
  );
  if (result.affectedRows === 0) {
    throw new ApiError(409, "Someone else changed the settings since you opened them. Reload to see their changes.");
  }
  return get();
}

module.exports = { get, update };
