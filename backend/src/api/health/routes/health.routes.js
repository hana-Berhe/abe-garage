import express from "express";
import { pool } from "../../../config/db.js";
import { send } from "../../../shared/respond.js";

const router = express.Router();

const TIMEOUT_MS = 2000;

// BE-048: ready only when the database answers within 2 seconds and setup has run (the settings row exists).
// Otherwise 503 with nothing about the database in the answer.
router.get("/", async (req, res) => {
  let timer;
  try {
    const check = pool.query("SELECT 1 FROM garage_settings WHERE settings_id = 1");
    check.catch(() => {}); // a late failure after the timeout must not go unhandled
    const timeout = new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error("Health check timed out")), TIMEOUT_MS);
    });
    const [rows] = await Promise.race([check, timeout]);
    if (rows.length !== 1) throw new Error("Not installed");
    return send(res, 200, "Check API readiness successful", { service: "abe-garage-api", ready: true });
  } catch {
    return send(res, 503, "Service unavailable", { service: "abe-garage-api", ready: false });
  } finally {
    clearTimeout(timer);
  }
});

export default router;
