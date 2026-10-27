// Applies the newer files in db/migrations to the database in .env (BE-002).
//   npm run migrate                  apply every file the database doesn't have yet
//   npm run migrate -- --already=006 first record 002..006 as done (they were run by hand before this runner)
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mysql = require("mysql2/promise");
const { listMigrations, markApplied, migrate } = require("./migrator");

async function main() {
  const already = (process.argv.find((a) => a.startsWith("--already=")) || "").split("=")[1];
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });
  try {
    if (already) {
      const upTo = listMigrations().filter((v) => v.slice(0, 3) <= already.padStart(3, "0"));
      await markApplied(conn, upTo);
      console.log(`Recorded as already done: ${upTo.join(", ") || "none"}`);
    }
    const ran = await migrate(conn, console.log);
    console.log(ran.length ? `Done: ${ran.length} change(s) applied.` : "The database is up to date.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(`Migration failed: ${err.message}`);
  process.exit(1);
});
