// Shared set-up for the integration tests (BE-049). Each test file gets a fresh, empty test database,
// installs the app into it through POST /api/install, and talks to the real API over HTTP.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env.test") });

// Never touch real data: the database name must end in _test.
process.env.DB_NAME = process.env.TEST_DB_NAME || "abe_garage_test";
if (!/_test$/.test(process.env.DB_NAME)) throw new Error("TEST_DB_NAME must end with _test");
process.env.DB_HOST = process.env.DB_HOST || "127.0.0.1";
process.env.JWT_SECRET = process.env.JWT_SECRET || "integration_test_secret_0123456789";
process.env.JWT_EXPIRES_IN = "1h";
process.env.INSTALL_ADMIN_EMAIL = "admin@test.local";
process.env.INSTALL_ADMIN_PASSWORD = "AdminPass123";
process.env.APP_TIMEZONE = process.env.APP_TIMEZONE || "Africa/Addis_Ababa";
process.env.CLIENT_URL = "http://localhost:5173";
delete process.env.SMTP_HOST;

const mysql = require("mysql2/promise");
const { after, before } = require("node:test");

const mail = { sent: [], fail: false };
require("../../src/shared/mailer").setTransportForTests({
  sendMail: async (message) => {
    if (mail.fail) throw new Error("Test mail server is down");
    mail.sent.push(message);
  },
});

async function resetDatabase() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  await conn.query(`DROP DATABASE IF EXISTS \`${process.env.DB_NAME}\``);
  await conn.query(`CREATE DATABASE \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4`);
  await conn.end();
}

const ctx = { base: null, server: null, pool: null };

async function api(method, url, token, body) {
  const res = await fetch(ctx.base + url, {
    method,
    headers: { "content-type": "application/json", ...(token ? { "x-access-token": token } : {}) },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { code: res.status, headers: res.headers, ...json };
}

const sql = (query, params) => ctx.pool.query(query, params).then(([rows]) => rows);

async function login(email, password = "Password123") {
  const r = await api("POST", "/api/auth/login", null, { email, password });
  if (r.code !== 200) throw new Error(`login ${email}: ${r.code} ${r.message}`);
  return r.data.token;
}

// Fresh database, installed app, and a small fixture set: admin, manager, two technicians, three services.
function useApp() {
  const f = {};
  before(async () => {
    await resetDatabase();
    const app = require("../../src/app");
    ctx.pool = require("../../src/config/db").pool;
    await new Promise((resolve) => {
      ctx.server = app.listen(0, "127.0.0.1", resolve);
    });
    ctx.base = `http://127.0.0.1:${ctx.server.address().port}`;
    const installed = await api("POST", "/api/install");
    if (installed.code !== 201 && installed.code !== 200) throw new Error(`install: ${installed.code} ${installed.message}`);
    f.admin = await login("admin@test.local", "AdminPass123");
    const staff = async (email, role_id, first_name) => {
      const r = await api("POST", "/api/employees", f.admin, { email, first_name, last_name: "Test", password: "Password123", role_id });
      return r.data.employee_id;
    };
    f.managerId = await staff("manager@test.local", 2, "Mona");
    f.techId = await staff("tech@test.local", 1, "Tewodros");
    f.tech2Id = await staff("tech2@test.local", 1, "Tigist");
    f.manager = await login("manager@test.local");
    f.tech = await login("tech@test.local");
    f.tech2 = await login("tech2@test.local");
    const service = async (name, price) => (await api("POST", "/api/services", f.admin, { name, price, labor_hours: "1" })).data;
    f.oil = await service("Oil change", "50.00");
    f.brakes = await service("Brakes", "180.00");
    f.align = await service("Wheel alignment", "40.00");
  });
  after(async () => {
    await new Promise((resolve) => ctx.server.close(resolve));
    await ctx.pool.end();
  });
  return f;
}

let unique = 0;
// A new customer with one car. Returns { customer, vehicle }.
async function newCustomer(token, extra = {}) {
  unique += 1;
  const n = String(unique).padStart(4, "0");
  const r = await api("POST", "/api/customers", token, {
    first_name: "Sara",
    last_name: `Tesfaye${n}`,
    email: `sara${n}@example.com`,
    phone: `0912${n}00`,
    vehicle: { make: "Toyota", model: "Corolla", plate: `AA-${n}`, year: 2020, mileage: 65000 },
    ...extra,
  });
  if (r.code !== 201) throw new Error(`customer: ${r.code} ${r.message}`);
  const cars = await api("GET", `/api/customers/${r.data.customer_id}/vehicles`, token);
  return { customer: r.data, vehicle: cars.data[0] };
}

async function newOrder(token, f, services, extra = {}) {
  const { customer, vehicle } = await newCustomer(token);
  const r = await api("POST", "/api/orders", token, {
    customer_id: customer.customer_id,
    vehicle_id: vehicle.vehicle_id,
    lines: services.map((s) => ({ service_id: s.service_id })),
    ...extra,
  });
  if (r.code !== 201) throw new Error(`order: ${r.code} ${r.message}`);
  return (await api("GET", `/api/orders/${r.data.order_id}`, token)).data;
}

// Takes an order to Completed: approve, assign every job to `techId`, start and finish each one.
async function completeOrder(f, order, { techToken = f.tech, techId = f.techId } = {}) {
  await api("PATCH", `/api/orders/${order.order_id}/approval`, f.manager, { decision: "approve", method: "phone" });
  for (const l of order.lines) await api("PATCH", `/api/order-lines/${l.line_id}/technician`, f.manager, { technician_id: techId });
  for (const l of order.lines) await api("PATCH", `/api/order-lines/${l.line_id}/status`, techToken, { status: 1 });
  let last;
  for (const l of order.lines) last = await api("PATCH", `/api/order-lines/${l.line_id}/status`, techToken, { status: 2 });
  return last.data;
}

module.exports = { useApp, api, sql, login, newCustomer, newOrder, completeOrder, mail, ctx };
