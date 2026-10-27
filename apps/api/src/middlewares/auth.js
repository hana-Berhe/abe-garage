const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { ApiError } = require("../shared/respond");

const ROLES = { TECHNICIAN: 1, MANAGER: 2, ADMIN: 3 };

const sessionEnded = () => new ApiError(401, "Your session has ended, please log in again");

// 401 when the x-access-token header is missing or expired.
// The account is read again on every request, so a switched-off or changed account stops working at once:
// a role change, switch-off or password change bumps token_version and old tokens no longer match (BE-003).
async function verifyToken(req, res, next) {
  const token = req.headers["x-access-token"];
  if (!token) return next(new ApiError(401, "Please log in"));
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next(sessionEnded());
  }
  try {
    const [rows] = await pool.query(
      "SELECT employee_id, role_id, active, token_version, first_name, last_name FROM employees WHERE employee_id = ?",
      [payload.employee_id]
    );
    const employee = rows[0];
    if (!employee || employee.token_version !== payload.token_version) return next(sessionEnded());
    if (!employee.active) return next(new ApiError(403, "Account disabled"));
    req.employee = { id: employee.employee_id, role: employee.role_id, name: `${employee.first_name} ${employee.last_name}` };
    return next();
  } catch (err) {
    return next(err);
  }
}

// 403 when the role is not in the list. The server check is the real one (FR-AUTH-04).
function hasRole(allowed) {
  return (req, res, next) => {
    if (!req.employee || !allowed.includes(req.employee.role)) {
      return next(new ApiError(403, "You do not have permission for this action"));
    }
    return next();
  };
}

module.exports = { verifyToken, hasRole, ROLES };
