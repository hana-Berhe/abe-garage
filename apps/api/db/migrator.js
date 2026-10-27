// BE-002: the database remembers which change files in db/migrations it already has (table schema_migrations),
// so `npm run migrate` applies each newer file once, in name order.
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "migrations");

const LEDGER = `CREATE TABLE IF NOT EXISTS schema_migrations (
  version    VARCHAR(100) NOT NULL,
  applied_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

// "007_order_line_copies.sql" -> version "007_order_line_copies"
const listMigrations = () =>
  fs.readdirSync(DIR).filter((f) => /^\d{3}_[\w-]+\.sql$/.test(f)).sort().map((f) => f.replace(/\.sql$/, ""));

async function applied(conn) {
  await conn.query(LEDGER);
  const [rows] = await conn.query("SELECT version FROM schema_migrations");
  return new Set(rows.map((r) => r.version));
}

// Records versions as done without running them: a fresh install (schema.sql already has every change),
// or files someone ran by hand before this runner existed.
async function markApplied(conn, versions) {
  await conn.query(LEDGER);
  for (const v of versions) await conn.query("INSERT IGNORE INTO schema_migrations (version) VALUES (?)", [v]);
}

// conn needs multipleStatements: a file can hold several statements.
// Each file is recorded straight after it runs, so a failure stops there and a rerun continues from that file.
async function migrate(conn, log = () => {}) {
  const done = await applied(conn);
  const ran = [];
  for (const v of listMigrations()) {
    if (done.has(v)) continue;
    log(`Applying ${v}`);
    await conn.query(fs.readFileSync(path.join(DIR, `${v}.sql`), "utf8"));
    await markApplied(conn, [v]);
    ran.push(v);
  }
  return ran;
}

module.exports = { LEDGER, listMigrations, markApplied, migrate };
