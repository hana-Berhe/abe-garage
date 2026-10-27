// The open problems and security items from the v3 audit: estimate edits keep jobs, the technician view,
// car rules, health, setup key, status page and resend limits, login timing and length, safety headers.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { useApp, api, sql, login, newCustomer, newOrder } = require("./helpers");

const f = useApp();

test("changing one job's price keeps every job's number and technician (BE-032)", async () => {
  const order = await newOrder(f.manager, f, [f.oil, f.brakes]);
  const [oil, brakes] = order.lines;
  await api("PATCH", `/api/order-lines/${oil.line_id}/technician`, f.manager, { technician_id: f.techId });
  const before = (await api("GET", `/api/orders/${order.order_id}`, f.manager)).data;

  const r = await api("PATCH", `/api/orders/${order.order_id}`, f.manager, {
    lines: [
      { line_id: oil.line_id, service_id: f.oil.service_id },
      { line_id: brakes.line_id, service_id: f.brakes.service_id, price: "200.00" },
    ],
    updated_at: before.updated_at,
  });
  assert.equal(r.code, 200);
  assert.deepEqual(r.data.lines.map((l) => [l.line_id, l.technician_id, l.line_price]), [
    [oil.line_id, f.techId, "50.00"],
    [brakes.line_id, null, "200.00"],
  ]);
  assert.equal(r.data.total, "287.50");
});

test("without line_id, jobs are matched by service; removing one keeps the others", async () => {
  const order = await newOrder(f.manager, f, [f.oil, f.brakes, f.align]);
  const [oil, brakes] = order.lines;
  await api("PATCH", `/api/order-lines/${brakes.line_id}/technician`, f.manager, { technician_id: f.tech2Id });
  const before = (await api("GET", `/api/orders/${order.order_id}`, f.manager)).data;

  const r = await api("PATCH", `/api/orders/${order.order_id}`, f.manager, {
    lines: [{ service_id: f.brakes.service_id }, { service_id: f.oil.service_id, price: "55.00" }],
    updated_at: before.updated_at,
  });
  assert.equal(r.code, 200);
  assert.deepEqual(r.data.lines.map((l) => [l.line_id, l.technician_id, l.line_price]), [
    [oil.line_id, null, "55.00"],
    [brakes.line_id, f.tech2Id, "180.00"],
  ]);
});

test("a line_id that is not an unstarted job of this order is refused and nothing changes", async () => {
  const order = await newOrder(f.manager, f, [f.oil]);
  const other = await newOrder(f.manager, f, [f.brakes]);
  const r = await api("PATCH", `/api/orders/${order.order_id}`, f.manager, {
    lines: [{ line_id: other.lines[0].line_id, service_id: f.oil.service_id, price: "1.00" }],
    updated_at: order.updated_at,
  });
  assert.equal(r.code, 400);
  assert.equal(r.data.field, "lines.0.line_id");
  const [line] = await sql("SELECT line_price FROM order_lines WHERE order_id = ?", [order.order_id]);
  assert.equal(line.line_price, "50.00");
});

test("a technician's order view leaves out customer contact, the internal note and the status code (BE-031)", async () => {
  const order = await newOrder(f.manager, f, [f.oil], { internal_notes: "SECRET-INTERNAL" });
  const r = await api("GET", `/api/orders/${order.order_id}`, f.tech);
  assert.equal(r.code, 200);
  for (const key of ["email", "phone", "internal_notes", "order_hash"]) assert.ok(!(key in r.data), key);
  const text = JSON.stringify(r.data);
  for (const hidden of ["SECRET-INTERNAL", order.email, order.phone, order.order_hash]) assert.ok(!text.includes(hidden), hidden);
  assert.equal(r.data.first_name, order.first_name);
  assert.equal(r.data.lines.length, 1);

  const office = await api("GET", `/api/orders/${order.order_id}`, f.manager);
  assert.equal(office.data.internal_notes, "SECRET-INTERNAL");
  assert.equal(office.data.phone, order.phone);
});

test("My Jobs has no internal notes (BE-036)", async () => {
  const order = await newOrder(f.manager, f, [f.oil], { internal_notes: "SECRET-INTERNAL" });
  await api("PATCH", `/api/orders/${order.order_id}/approval`, f.manager, { decision: "approve", method: "phone" });
  await api("PATCH", `/api/order-lines/${order.lines[0].line_id}/technician`, f.manager, { technician_id: f.techId });
  const jobs = await api("GET", "/api/my-jobs", f.tech);
  assert.ok(jobs.data.some((j) => j.order_id === order.order_id));
  assert.ok(!JSON.stringify(jobs.data).includes("SECRET-INTERNAL"));
});

test("mileage can't go down, on the car or with a new order (BE-023)", async () => {
  const { customer, vehicle } = await newCustomer(f.manager);
  const lower = await api("PATCH", `/api/vehicles/${vehicle.vehicle_id}`, f.manager, { mileage: 10, updated_at: vehicle.updated_at });
  assert.equal(lower.code, 409);
  assert.equal(lower.data.field, "mileage");
  const higher = await api("PATCH", `/api/vehicles/${vehicle.vehicle_id}`, f.manager, { mileage: 70000, updated_at: vehicle.updated_at });
  assert.equal(higher.code, 200);
  assert.equal(higher.data.mileage, 70000);

  const order = await api("POST", "/api/orders", f.manager, {
    customer_id: customer.customer_id, vehicle_id: vehicle.vehicle_id, lines: [{ service_id: f.oil.service_id }], mileage: 60000,
  });
  assert.equal(order.code, 409);
  const [{ n }] = await sql("SELECT COUNT(*) AS n FROM orders WHERE vehicle_id = ?", [vehicle.vehicle_id]);
  assert.equal(n, 0);
});

test("no new car for a switched-off customer (409) or a missing one (404) (BE-020)", async () => {
  const { customer } = await newCustomer(f.manager);
  await api("PATCH", `/api/customers/${customer.customer_id}`, f.manager, { active: 0, updated_at: customer.updated_at });
  const off = await api("POST", "/api/vehicles", f.manager, { customer_id: customer.customer_id, make: "Kia", model: "Rio", plate: "OFF-001" });
  assert.equal(off.code, 409);
  const missing = await api("POST", "/api/vehicles", f.manager, { customer_id: 999999, make: "Kia", model: "Rio", plate: "OFF-002" });
  assert.equal(missing.code, 404);
  const [{ n }] = await sql("SELECT COUNT(*) AS n FROM vehicles WHERE plate IN ('OFF-001', 'OFF-002')");
  assert.equal(n, 0);
});

test("health is 503 when the database can't answer (BE-048)", async () => {
  await sql("RENAME TABLE garage_settings TO garage_settings_away");
  try {
    const down = await api("GET", "/api/health");
    assert.equal(down.code, 503);
    assert.deepEqual(down.data, { service: "abe-garage-api", ready: false });
    assert.ok(!JSON.stringify(down).includes("garage_settings"));
  } finally {
    await sql("RENAME TABLE garage_settings_away TO garage_settings");
  }
  assert.equal((await api("GET", "/api/health")).code, 200);
});

test("setup needs the setup key, and is hidden when switched off (BE-047)", async () => {
  assert.equal((await api("POST", "/api/install")).code, 403);
  assert.equal((await api("POST", "/api/install", null, undefined, { "x-setup-key": "wrong" })).code, 403);
  process.env.INSTALL_ENABLED = "false";
  try {
    assert.equal((await api("POST", "/api/install", null, undefined, { "x-setup-key": process.env.INSTALL_SECRET })).code, 404);
  } finally {
    process.env.INSTALL_ENABLED = "true";
  }
});

test("status page answers are never cached and the lookups are limited (BE-044)", async () => {
  const order = await newOrder(f.manager, f, [f.oil]);
  const ok = await api("GET", `/api/public/orders/${order.order_hash}`);
  const missing = await api("GET", `/api/public/orders/${"0".repeat(32)}`);
  for (const r of [ok, missing]) {
    assert.equal(r.headers.get("cache-control"), "no-store");
    assert.equal(r.headers.get("referrer-policy"), "no-referrer");
  }
  // 60 lookups from one address in 15 minutes: 2 above, 58 more, then the 61st is refused.
  for (let i = 0; i < 58; i++) assert.equal((await api("GET", `/api/public/orders/${"1".repeat(32)}`)).code, 404);
  const over = await api("GET", `/api/public/orders/${order.order_hash}`);
  assert.equal(over.code, 429);
  assert.equal(over.headers.get("cache-control"), "no-store");
});

test("resending the same order's email is limited to 3 in 15 minutes (BE-045)", async () => {
  const order = await newOrder(f.manager, f, [f.oil]);
  const codes = [];
  for (let i = 0; i < 4; i++) codes.push((await api("POST", `/api/orders/${order.order_id}/resend-email`, f.manager)).code);
  assert.deepEqual(codes, [200, 200, 200, 429]);
});

test("an unknown email takes as long as a wrong password (BE-004)", async () => {
  const time = async (email) => {
    const start = process.hrtime.bigint();
    const r = await api("POST", "/api/auth/login", null, { email, password: "Wrong12345" });
    assert.equal(r.code, 401);
    return Number(process.hrtime.bigint() - start) / 1e6;
  };
  let known = 0;
  let unknown = 0;
  for (let i = 0; i < 3; i++) {
    known += await time("manager@test.local");
    unknown += await time(`nobody${i}@test.local`);
  }
  // Both run one bcrypt check (tens of milliseconds); without it an unknown email answers in about 1 ms.
  assert.ok(unknown > known * 0.5, `unknown ${unknown.toFixed(1)} ms vs wrong password ${known.toFixed(1)} ms`);
});

test("a login lasts 1 hour by default (BE-004)", async () => {
  const saved = process.env.JWT_EXPIRES_IN;
  delete process.env.JWT_EXPIRES_IN;
  try {
    const token = await login("tech2@test.local");
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url"));
    assert.equal(payload.exp - payload.iat, 3600);
  } finally {
    process.env.JWT_EXPIRES_IN = saved;
  }
});

test("standard browser safety headers are set", async () => {
  const r = await api("GET", "/api/health");
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.equal(r.headers.get("x-frame-options"), "SAMEORIGIN");
});
