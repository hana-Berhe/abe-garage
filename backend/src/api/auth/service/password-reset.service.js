import crypto from "crypto";
import bcrypt from "bcrypt";
import { pool, withTransaction } from "../../../config/db.js";
import { ApiError } from "../../../shared/respond.js";
import { sendMail } from "../../../shared/mailer.js";

const LINK_MINUTES = 15;
const TOKEN_RE = /^[0-9a-f]{64}$/;

const sha256 = (text) => crypto.createHash("sha256").update(text).digest("hex");
const invalidLink = () => new ApiError(400, "This reset link is invalid or has expired. Ask for a new one.");

function resetLink(token) {
  return `${(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "")}/reset-password?token=${token}`;
}

// BE-005. Returns the email to send, or null when there is no active account (the caller answers the same either way).
// The raw token only ever goes into the email; the database keeps its SHA-256.
async function requestReset(email) {
  const [rows] = await pool.query("SELECT employee_id, first_name, email, active FROM employees WHERE email = ?", [email]);
  const employee = rows[0];
  if (!employee || !employee.active) return null;
  const token = crypto.randomBytes(32).toString("hex");
  const issued = await withTransaction(async (conn) => {
    // Lock the employee first (same order as the reset), so two requests at once leave exactly one live link.
    const [[locked]] = await conn.query("SELECT active FROM employees WHERE employee_id = ? FOR UPDATE", [
      employee.employee_id,
    ]);
    if (!locked || !locked.active) return false;
    await conn.query("UPDATE password_reset_tokens SET used_at = UTC_TIMESTAMP() WHERE employee_id = ? AND used_at IS NULL", [
      employee.employee_id,
    ]);
    await conn.query(
      `INSERT INTO password_reset_tokens (employee_id, token_hash, expires_at)
       VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL ${LINK_MINUTES} MINUTE)`,
      [employee.employee_id, sha256(token)]
    );
    return true;
  });
  if (!issued) return null;
  return {
    to: employee.email,
    subject: "Reset your Abe Garage password",
    text:
      `Hello ${employee.first_name},\n\nSomeone asked to reset the password for your staff account.\n` +
      `Choose a new password here (the link works once, for ${LINK_MINUTES} minutes):\n${resetLink(token)}\n\n` +
      "If this wasn't you, you can ignore this email. Your password stays the same.",
  };
}

// Sent after the answer has gone back, so a slow or failing mail server neither delays nor changes it.
async function sendResetEmail(message) {
  const sent = await sendMail(message);
  if (!sent) console.error("Password reset email was not sent (check the SMTP settings)");
}

// BE-006. Missing, used or expired links and switched-off accounts all get the same 400.
async function resetPassword(token, newPassword) {
  if (!TOKEN_RE.test(token)) throw invalidLink();
  const tokenHash = sha256(token);
  const [rows] = await pool.query("SELECT employee_id FROM password_reset_tokens WHERE token_hash = ?", [tokenHash]);
  if (!rows[0]) throw invalidLink();
  const employeeId = rows[0].employee_id;
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await withTransaction(async (conn) => {
    const [[employee]] = await conn.query("SELECT active FROM employees WHERE employee_id = ? FOR UPDATE", [employeeId]);
    const [[live]] = await conn.query(
      `SELECT token_id FROM password_reset_tokens
       WHERE token_hash = ? AND employee_id = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP() FOR UPDATE`,
      [tokenHash, employeeId]
    );
    if (!employee || !employee.active || !live) throw invalidLink();
    // A new token_version signs the person out on every device.
    await conn.query("UPDATE employees SET password_hash = ?, token_version = token_version + 1 WHERE employee_id = ?", [
      passwordHash,
      employeeId,
    ]);
    await conn.query("UPDATE password_reset_tokens SET used_at = UTC_TIMESTAMP() WHERE employee_id = ? AND used_at IS NULL", [
      employeeId,
    ]);
  });
}

export { requestReset, sendResetEmail, resetPassword, LINK_MINUTES };
