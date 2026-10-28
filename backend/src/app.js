import express from "express";
import cors from "cors";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import routes from "./routes.js";
import { notFound, errorHandler } from "./middlewares/error-handler.js";

const app = express();

// Behind a hosting proxy, set TRUST_PROXY (for example 1) so login limits see the visitor's address, not the proxy's.
if (process.env.TRUST_PROXY) {
  app.set("trust proxy", /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);
}

// Every answer carries an X-Request-ID, and server errors log it, so a report from a user can be matched to the log line.
app.use((req, res, next) => {
  req.id = randomUUID();
  res.set("X-Request-ID", req.id);
  next();
});

// Standard browser safety headers (no sniffing, no framing, no referrer, and so on).
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
// BE-001: up to 256 KB; bigger bodies get 413.
app.use(express.json({ limit: "256kb" }));

// The only place /api appears. Feature prefixes live in routes.js.
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
