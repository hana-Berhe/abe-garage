import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes.js";
import { notFound, errorHandler } from "./middlewares/error-handler.js";

const app = express();

// Behind a hosting proxy, set TRUST_PROXY (for example 1) so login limits see the visitor's address, not the proxy's.
if (process.env.TRUST_PROXY) {
  app.set("trust proxy", /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);
}

// Standard browser safety headers (no sniffing, no framing, no referrer, and so on).
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
// BE-001: up to 256 KB; bigger bodies get 413.
app.use(express.json({ limit: "256kb" }));

app.use(routes);

app.use(notFound);
app.use(errorHandler);

export default app;
