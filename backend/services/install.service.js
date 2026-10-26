const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const { pool } = require("../config/db");
const { ApiError } = require("../utils/respond");

const SCHEMA_FILE = path.join(__dirname, "..", "sql", "schema.sql");

async function isInstalled() {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS n FROM employees");
    return rows[0].n > 0;
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") return false;
    throw err;
  }
}

// FR-INS-01..03: create the tables, roles, settings and one admin. Locked once staff exist.
async function install() {
  if (await isInstalled()) throw new ApiError(403, "The system is already installed");

  const email = (process.env.INSTALL_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.INSTALL_ADMIN_PASSWORD || "";
  if (!email || password.length < 8) {
    throw new ApiError(500, "Set INSTALL_ADMIN_EMAIL and an INSTALL_ADMIN_PASSWORD of 8+ characters in .env");
  }

  // schema.sql holds many statements, so it runs on its own connection.
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });
  try {
    await conn.query(fs.readFileSync(SCHEMA_FILE, "utf8"));
  } finally {
    await conn.end();
  }

  // The first admin gets a bcrypt hash made here, never typed into SQL.
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT IGNORE INTO employees (email, first_name, last_name, password_hash, role_id, active)
     VALUES (?, ?, ?, ?, 3, 1)`,
    [email, process.env.INSTALL_ADMIN_FIRST_NAME || "Abe", process.env.INSTALL_ADMIN_LAST_NAME || "Admin", hash]
  );
  return { admin_email: email };
}

module.exports = { install, isInstalled };
