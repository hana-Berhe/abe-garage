const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  // Times are stored and read in UTC (NFR-17).
  timezone: "Z",
  // DECIMAL money columns come back as strings; keep them exact.
  decimalNumbers: false,
});

pool.pool.on("connection", (conn) => {
  conn.query("SET time_zone = '+00:00'");
});

// Run fn(conn) inside one transaction; commit on success, roll back on any error (NFR-06).
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, withTransaction };
