const jwt = require("jsonwebtoken");
const { ApiError } = require("../shared/respond");

const ROLES = { TECHNICIAN: 1, MANAGER: 2, ADMIN: 3 };

// 401 when the x-access-token header is missing or expired.
function verifyToken(req, res, next) {
  const token = req.headers["x-access-token"];
  if (!token) return next(new ApiError(401, "Please log in"));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.employee = { id: payload.employee_id, role: payload.role_id, name: payload.name };
    return next();
  } catch {
    return next(new ApiError(401, "Your session has ended, please log in again"));
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
