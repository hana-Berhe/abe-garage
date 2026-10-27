const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { pool, withTransaction } = require("../../config/db");
const { ApiError } = require("../../shared/respond");
const { pageResult, likePattern } = require("../../shared/pagination");
const { ROLES } = require("../../middlewares/auth");
const { signAccessToken } = require("../../shared/tokens");

const PUBLIC_COLUMNS = `e.employee_id, e.email, e.first_name, e.last_name, e.phone, e.role_id, r.role_name,
  e.active, e.created_at, e.updated_at`;

// Same cost (10) as real password hashes, made once at start-up. No password matches it in practice.
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), 10);

// FR-AUTH-01..03. Wrong email and wrong password give the same message.
async function login(email, password) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, e.password_hash, e.token_version FROM employees e JOIN roles r ON r.role_id = e.role_id WHERE e.email = ?`,
    [email]
  );
  const employee = rows[0];
  // BE-004: an unknown email still runs one bcrypt check, so it takes as long as a wrong password.
  const passwordOk = await bcrypt.compare(password, employee ? employee.password_hash : DUMMY_HASH);
  if (!employee) throw new ApiError(401, "Email or password is wrong");
  if (!passwordOk) throw new ApiError(401, "Email or password is wrong");
  if (!employee.active) throw new ApiError(403, "Account disabled");

  const token = signAccessToken(employee);
  delete employee.password_hash;
  delete employee.token_version;
  return { ...token, employee };
}

// FR-AUTH-07, BE-007. Bumping token_version signs the person out everywhere, this device included.
async function changePassword(employeeId, oldPassword, newPassword) {
  const [rows] = await pool.query("SELECT password_hash FROM employees WHERE employee_id = ?", [employeeId]);
  if (!rows[0]) throw new ApiError(404, "Employee not found");
  if (!(await bcrypt.compare(oldPassword, rows[0].password_hash))) {
    throw new ApiError(400, "Current password is wrong", { field: "old_password" });
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE employees SET password_hash = ?, token_version = token_version + 1 WHERE employee_id = ?", [
    hash,
    employeeId,
  ]);
}

async function emailTaken(email, exceptId = 0) {
  const [rows] = await pool.query("SELECT employee_id FROM employees WHERE email = ? AND employee_id <> ?", [
    email,
    exceptId,
  ]);
  return rows.length > 0;
}

// FR-EMP-01, FR-EMP-02
async function create(data) {
  if (await emailTaken(data.email)) throw new ApiError(409, "Email already used", { field: "email" });
  const hash = await bcrypt.hash(data.password, 10);
  const [result] = await pool.query(
    `INSERT INTO employees (email, first_name, last_name, phone, password_hash, role_id, active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.email, data.first_name, data.last_name, data.phone, hash, data.role_id, data.active]
  );
  return getById(result.insertId);
}

// FR-EMP-03. Managers only ever see active technicians (to assign jobs).
async function list({ page, search, limit, offset, roleId, activeOnly }) {
  const where = [];
  const params = [];
  if (search) {
    where.push("(e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR CONCAT(e.first_name, ' ', e.last_name) LIKE ?)");
    const like = likePattern(search);
    params.push(like, like, like, like);
  }
  if (roleId) {
    where.push("e.role_id = ?");
    params.push(roleId);
  }
  if (activeOnly) where.push("e.active = 1");
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM employees e ${whereSql}`, params);
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM employees e JOIN roles r ON r.role_id = e.role_id ${whereSql}
     ORDER BY e.active DESC, e.first_name, e.last_name LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return pageResult(rows, total, page, limit);
}

async function getById(id) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM employees e JOIN roles r ON r.role_id = e.role_id WHERE e.employee_id = ?`,
    [id]
  );
  if (!rows[0]) throw new ApiError(404, "Employee not found");
  return rows[0];
}

// BE-008: the logged-in person's own details, read fresh from the database (never the password hash or token_version).
async function getProfile(id) {
  const [rows] = await pool.query(
    `SELECT e.employee_id, e.first_name, e.last_name, e.email, e.phone, e.role_id, r.role_name, e.active, e.created_at
     FROM employees e JOIN roles r ON r.role_id = e.role_id WHERE e.employee_id = ?`,
    [id]
  );
  if (!rows[0]) throw new ApiError(404, "Employee not found");
  return { ...rows[0], active: rows[0].active === 1 };
}

// FR-EMP-04, FR-EMP-05, NFR-16. The save only applies if updated_at still matches.
// BE-012: the garage always keeps at least one active admin, even when two admins edit each other at once.
async function update(id, data, actingEmployeeId) {
  const current = await getById(id);
  if (id === actingEmployeeId && (data.active === 0 || data.role_id !== ROLES.ADMIN)) {
    throw new ApiError(400, "You cannot deactivate your own account or remove your own admin role", {
      field: data.active === 0 ? "active" : "role_id",
    });
  }
  if (await emailTaken(data.email, id)) throw new ApiError(409, "Email already used", { field: "email" });

  const sets = ["email = ?", "first_name = ?", "last_name = ?", "phone = ?", "role_id = ?", "active = ?"];
  const params = [data.email, data.first_name, data.last_name, data.phone, data.role_id, data.active];
  // BE-012: a new role or a switch-off signs the person out at once.
  if (data.role_id !== current.role_id || data.active !== current.active) {
    sets.push("token_version = token_version + 1");
  }
  const emailChanged = data.email.toLowerCase() !== current.email.toLowerCase();
  const removesAdmin = data.role_id !== ROLES.ADMIN || data.active === 0;

  await withTransaction(async (conn) => {
    if (removesAdmin) {
      // Lock every active admin in the same order, so two of these edits run one after the other.
      const [admins] = await conn.query(
        "SELECT employee_id FROM employees WHERE role_id = ? AND active = 1 ORDER BY employee_id FOR UPDATE",
        [ROLES.ADMIN]
      );
      if (admins.some((a) => a.employee_id === id) && admins.length === 1) {
        throw new ApiError(409, "At least one active admin is required. Make someone else an admin first.", {
          field: data.active === 0 ? "active" : "role_id",
        });
      }
    }
    const [result] = await conn.query(
      `UPDATE employees SET ${sets.join(", ")} WHERE employee_id = ? AND updated_at = ?`,
      [...params, id, new Date(data.updated_at)]
    );
    if (result.affectedRows === 0) {
      throw new ApiError(409, "Someone else changed this employee since you opened it. Reload to see their changes.", {
        current,
      });
    }
    // BE-012: a reset link sent to the old address stops working.
    if (emailChanged) {
      await conn.query("UPDATE password_reset_tokens SET used_at = UTC_TIMESTAMP() WHERE employee_id = ? AND used_at IS NULL", [id]);
    }
  });
  return getById(id);
}

module.exports = { login, changePassword, create, list, getById, getProfile, update };
