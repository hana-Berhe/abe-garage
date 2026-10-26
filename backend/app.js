const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => res.json({ status: "success", message: "OK", data: null }));
app.use(routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
