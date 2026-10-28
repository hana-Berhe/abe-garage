import "./config/env.js";
import app from "./app.js";
import { pool } from "./config/db.js";

for (const key of ["DB_HOST", "DB_NAME", "DB_USER", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in .env (see .env.example)`);
    process.exit(1);
  }
}
// A short secret can be guessed, and then anyone can make their own login token.
if (process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET in .env must be a random value of at least 32 characters");
  process.exit(1);
}

const port = Number(process.env.PORT) || 8000;
const server = app.listen(port, () => console.log(`Abe Garage API on http://localhost:${port}`));

// On Ctrl+C or a host restart: stop taking new requests, let open ones finish, then close the database pool.
// If that takes longer than 10 seconds, quit anyway.
let closing = false;
function shutdown(signal) {
  if (closing) return;
  closing = true;
  console.log(`${signal} received, shutting down`);
  setTimeout(() => process.exit(1), 10000).unref();
  server.close(async () => {
    try {
      await pool.end();
      process.exit(0);
    } catch {
      process.exit(1);
    }
  });
}
process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
