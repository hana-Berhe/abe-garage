import mysql from "mysql2/promise";

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
  // DATE columns (such as the ready date) stay plain "YYYY-MM-DD" strings.
  dateStrings: ["DATE"],
});

pool.pool.on("connection", (conn) => {
  conn.query("SET time_zone = '+00:00'");
});

// Run fn(conn) inside one transaction; commit on success, roll back on any error (NFR-06).
// When two requests lock the same rows at once, the database may stop one with a deadlock and asks for a retry.
// fn only touches the database (emails go out after commit), so running it again is safe.
async function withTransaction(fn, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      if (err.code !== "ER_LOCK_DEADLOCK" || attempt >= attempts) throw err;
    } finally {
      conn.release();
    }
  }
}

export { pool, withTransaction };
