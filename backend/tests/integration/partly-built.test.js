// The six tasks that were partly built: BE-029, BE-035, BE-012, BE-003, BE-004 and BE-002.
import { test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import { useApp, api, sql, login, newCustomer, newOrder, errorField, mail } from "./helpers.js";
import { localToday } from "../../src/shared/time.js";
import { listMigrations, migrate } from "../../db/migrator.js";

const f = useApp();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- BE-029 ---

test("renaming a service doesn't change the job name on an open order (BE-029)", async () => {
  const svc = (await api("POST", "/api/services", f.admin, { name: "Coolant flush", description: "Drain and refill", price: "70.00", labor_hours: "1.5" })).data;
  const order = await newOrder(f.manager, f, [svc]);
  const renamed = await api("PATCH", `/api/services/${svc.service_id}`, f.admin, {
    name: "Cooling system service", description: "New text", labor_hours: "3", updated_at: svc.updated_at,
  });
  assert.equal(renamed.code, 200);
  const again = (await api("GET", `/api/orders/${order.order_id}`, f.manager)).data;
  assert.equal(again.lines[0].name, "Coolant flush");
  assert.equal(again.lines[0].service_description, "Drain and refill");
  assert.equal(again.lines[0].labor_hours, "1.50");
  const estimate = (await api("GET", `/api/orders/${order.order_id}/estimate`, f.manager)).data;
  assert.equal(estimate.lines[0].service_name, "Coolant flush");
  // A new order uses the new name.
  const fresh = await newOrder(f.manager, f, [svc]);
  assert.equal(fresh.lines[0].name, "Cooling system service");
});

test("a ready date in the past is refused; today is fine (BE-029)", async () => {
  const { customer, vehicle } = await newCustomer(f.manager);
  const body = { customer_id: customer.customer_id, vehicle_id: vehicle.vehicle_id, lines: [{ service_id: f.oil.service_id }] };
  const past = await api("POST", "/api/orders", f.manager, { ...body, estimated_ready_date: "2020-01-01" });
  assert.equal(past.code, 400);
  assert.equal(errorField(past), "estimated_ready_date");
  const today = await api("POST", "/api/orders", f.manager, { ...body, estimated_ready_date: localToday() });
  assert.equal(today.code, 201);
  const order = (await api("GET", `/api/orders/${today.data.order_id}`, f.manager)).data;
  const edit = await api("PATCH", `/api/orders/${order.order_id}`, f.manager, { estimated_ready_date: "2020-01-01", updated_at: order.updated_at });
  assert.equal(edit.code, 400);
});

// --- BE-035 ---

test("a started job can move to another technician and keeps its progress (BE-035)", async () => {
  const order = await newOrder(f.manager, f, [f.oil]);
  const line = order.lines[0];
  await api("PATCH", `/api/orders/${order.order_id}/approval`, f.manager, { decision: "approve", method: "phone" });
  await api("PATCH", `/api/order-lines/${line.line_id}/technician`, f.manager, { technician_id: f.techId });
  assert.equal((await api("PATCH", `/api/order-lines/${line.line_id}/status`, f.tech, { status: 1 })).code, 200);

  const moved = await api("PATCH", `/api/order-lines/${line.line_id}/technician`, f.manager, { technician_id: f.tech2Id });
  assert.equal(moved.code, 200);
  const after = moved.data.lines[0];
  assert.equal(after.technician_id, f.tech2Id);
  assert.equal(after.line_status, 1, "still started");
  const [h] = await sql("SELECT details FROM order_history WHERE order_id = ? AND action = 'technician_changed'", [order.order_id]);
  assert.match(h.details, /Tewodros Test → Tigist Test/);

  // The new technician may finish it; the old one no longer can.
  assert.equal((await api("PATCH", `/api/order-lines/${line.line_id}/status`, f.tech, { status: 2 })).code, 403);
  assert.equal((await api("PATCH", `/api/order-lines/${line.line_id}/status`, f.tech2, { status: 2 })).code, 200);
  // A done job stays with whoever did it.
  assert.equal((await api("PATCH", `/api/order-lines/${line.line_id}/technician`, f.manager, { technician_id: f.techId })).code, 400);
});

test("there is no un-assign, and choosing the same technician changes nothing (BE-035)", async () => {
  const order = await newOrder(f.manager, f, [f.oil]);
  const line = order.lines[0];
  await api("PATCH", `/api/order-lines/${line.line_id}/technician`, f.manager, { technician_id: f.techId });
  const none = await api("PATCH", `/api/order-lines/${line.line_id}/technician`, f.manager, { technician_id: null });
  assert.equal(none.code, 400);
  assert.equal(errorField(none), "technician_id");
  const same = await api("PATCH", `/api/order-lines/${line.line_id}/technician`, f.manager, { technician_id: f.techId });
  assert.equal(same.code, 200);
  const rows = await sql("SELECT action FROM order_history WHERE order_id = ? AND action LIKE 'technician%'", [order.order_id]);
  assert.deepEqual(rows.map((r) => r.action), ["technician_assigned"]);
});

// --- BE-012 ---

test("employee edit refuses a password and points to the reset email (BE-012)", async () => {
  const emp = (await api("GET", `/api/employees/${f.tech2Id}`, f.admin)).data;
  const r = await api("PATCH", `/api/employees/${f.tech2Id}`, f.admin, { password: "NewPassword9", updated_at: emp.updated_at });
  assert.equal(r.code, 400);
  assert.equal(errorField(r), "password");
  assert.match(r.data.errors.password, /Forgot password/);
  await login("tech2@test.local"); // the old password still works
});

test("changing an employee's email cancels reset links sent to the old address (BE-012)", async () => {
  const created = (await api("POST", "/api/employees", f.admin, { email: "move@test.local", first_name: "Move", last_name: "Test", password: "Password123", role_id: 1 })).data;
  await api("POST", "/api/auth/forgot-password", null, { email: "move@test.local" });
  await wait(200);
  const token = mail.sent.at(-1).text.match(/token=([0-9a-f]{64})/)[1];
  const saved = await api("PATCH", `/api/employees/${created.employee_id}`, f.admin, { email: "moved@test.local", updated_at: created.updated_at });
  assert.equal(saved.code, 200);
  const reset = await api("POST", "/api/auth/reset-password", null, { token, new_password: "Hijacked123" });
  assert.equal(reset.code, 400);
  await login("moved@test.local");
});

// --- BE-003 ---

test("unknown fields are refused with the field names (BE-003)", async () => {
  const r = await api("POST", "/api/services", f.admin, { name: "Wash", price: "10.00", colour: "red" });
  assert.equal(r.code, 400);
  assert.equal(r.status, "error");
  assert.equal(r.message, "Validation failed");
  assert.deepEqual(r.data, { errors: { colour: "Unknown field" } });
  const [{ n }] = await sql("SELECT COUNT(*) AS n FROM services WHERE name = 'Wash'");
  assert.equal(n, 0);

  // Inside a car on a new customer, and inside each job of an order.
  const car = await api("POST", "/api/customers", f.manager, { first_name: "A", last_name: "B", vehicle: { make: "Kia", model: "Rio", wheels: 4 } });
  assert.deepEqual(car.data.errors, { "vehicle.wheels": "Unknown field" });
  const { customer, vehicle } = await newCustomer(f.manager);
  const line = await api("POST", "/api/orders", f.manager, {
    customer_id: customer.customer_id, vehicle_id: vehicle.vehicle_id, lines: [{ service_id: f.oil.service_id, line_price: "1" }],
  });
  assert.deepEqual(line.data.errors, { "lines.0.line_price": "Unknown field" });
  // A body that is not an object.
  const list = await api("POST", "/api/auth/login", null, ["a"]);
  assert.equal(list.code, 400);
});

test("a field error answers { errors: { field: message } } and other errors carry no field (BE-003)", async () => {
  const bad = await api("POST", "/api/services", f.admin, { name: "", price: "10.00" });
  assert.equal(bad.code, 400);
  assert.equal(bad.message, "Validation failed");
  assert.deepEqual(Object.keys(bad.data), ["errors"]);
  assert.equal(typeof bad.data.errors.name, "string");
  const missing = await api("GET", "/api/orders/999999", f.manager);
  assert.equal(missing.code, 404);
  assert.equal(missing.status, "error");
  assert.equal(missing.data, null);
});

// --- BE-004 ---

test("login answers access_token, token_type and expires_in, and the token names issuer and audience (BE-004)", async () => {
  const r = await api("POST", "/api/auth/login", null, { email: "manager@test.local", password: "Password123" });
  assert.equal(r.code, 200);
  assert.equal(r.data.token_type, "Bearer");
  assert.equal(r.data.expires_in, 3600);
  assert.equal(r.data.employee.email, "manager@test.local");
  assert.equal(r.data.token, undefined);
  const decoded = jwt.decode(r.data.access_token, { complete: true });
  assert.equal(decoded.header.alg, "HS256");
  assert.equal(decoded.payload.iss, "abe-garage-api");
  assert.equal(decoded.payload.aud, "abe-garage-web");
  assert.equal(decoded.payload.token_use, "access");
  // The older x-access-token header still works.
  const old = await api("GET", "/api/profile", null, undefined, { "x-access-token": r.data.access_token });
  assert.equal(old.code, 200);
});

test("tokens with the wrong issuer, audience, use or algorithm get 401 (BE-004)", async () => {
  const [me] = await sql("SELECT employee_id, role_id, token_version FROM employees WHERE email = 'manager@test.local'");
  const claims = { employee_id: me.employee_id, role_id: me.role_id, token_version: me.token_version, token_use: "access" };
  const good = { issuer: "abe-garage-api", audience: "abe-garage-web", expiresIn: 600 };
  const secret = process.env.JWT_SECRET;
  const right = jwt.sign(claims, secret, good);
  assert.equal((await api("GET", "/api/dashboard", right)).code, 200, "the control token works");
  const wrong = [
    jwt.sign(claims, secret, { ...good, issuer: "someone-else" }),
    jwt.sign(claims, secret, { ...good, audience: "another-app" }),
    jwt.sign({ ...claims, token_use: "reset" }, secret, good),
    jwt.sign(claims, secret, { ...good, algorithm: "HS512" }),
    jwt.sign(claims, secret, { expiresIn: 600 }),
  ];
  for (const token of wrong) assert.equal((await api("GET", "/api/dashboard", token)).code, 401);
});

// --- BE-002 ---

test("a fresh install records every change file, and migrate applies a missing one once (BE-002)", async () => {
  const recorded = (await sql("SELECT version FROM schema_migrations ORDER BY version")).map((r) => r.version);
  assert.deepEqual(recorded, listMigrations());

  // Pretend the database is older: no 008 and no indexes.
  await sql("ALTER TABLE orders DROP INDEX ix_orders_paid_at, DROP INDEX ix_orders_status_created");
  await sql("DELETE FROM schema_migrations WHERE version = '008_order_report_indexes'");
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 3306, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME, multipleStatements: true,
  });
  try {
    assert.deepEqual(await migrate(conn), ["008_order_report_indexes"]);
    assert.deepEqual(await migrate(conn), [], "a second run does nothing");
  } finally {
    await conn.end();
  }
  const keys = (await sql("SHOW INDEX FROM orders")).map((k) => k.Key_name);
  assert.ok(keys.includes("ix_orders_paid_at") && keys.includes("ix_orders_status_created"));
});
