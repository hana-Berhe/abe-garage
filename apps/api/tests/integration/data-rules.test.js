// BE-049 (3): duplicates, bad input, a car that isn't the customer's, stale edits and roll-back.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { useApp, api, sql, newCustomer } = require("./helpers");

const f = useApp();

test("duplicate staff email, customer email/phone and car plate get 409 with the field", async () => {
  const staff = await api("POST", "/api/employees", f.admin, { email: "manager@test.local", first_name: "A", last_name: "B", password: "Password123", role_id: 1 });
  assert.equal(staff.code, 409);
  assert.equal(staff.data.field, "email");

  const { customer, vehicle } = await newCustomer(f.manager);
  const sameEmail = await api("POST", "/api/customers", f.manager, { first_name: "X", last_name: "Y", email: customer.email, phone: "0999000001" });
  assert.equal(sameEmail.code, 409);
  assert.equal(sameEmail.data.field, "email");
  const samePhone = await api("POST", "/api/customers", f.manager, { first_name: "X", last_name: "Y", email: "other@example.com", phone: customer.phone });
  assert.equal(samePhone.code, 409);
  assert.equal(samePhone.data.field, "phone");
  const samePlate = await api("POST", "/api/vehicles", f.manager, { customer_id: customer.customer_id, make: "Kia", model: "Rio", plate: vehicle.plate });
  assert.equal(samePlate.code, 409);
  assert.equal(samePlate.data.field, "plate");
});

test("bad input gets 400 and names the field", async () => {
  const cases = [
    ["POST", "/api/customers", f.manager, { first_name: "A", last_name: "B", email: "not-an-email", phone: "0911" }, "email"],
    ["POST", "/api/customers", f.manager, { last_name: "B", email: "a@b.com", phone: "0911000000" }, "first_name"],
    ["POST", "/api/services", f.admin, { name: "Bad", price: "-1" }, "price"],
    ["POST", "/api/employees", f.admin, { email: "short@test.local", first_name: "A", last_name: "B", password: "short", role_id: 1 }, "password"],
    ["POST", "/api/employees", f.admin, { email: "role@test.local", first_name: "A", last_name: "B", password: "Password123", role_id: 9 }, "role_id"],
    ["POST", "/api/auth/login", null, { email: "x@test.local" }, "password"],
  ];
  for (const [method, path, token, body, field] of cases) {
    const r = await api(method, path, token, body);
    assert.equal(r.code, 400, `${path} ${field}`);
    assert.equal(r.status, "fail");
    assert.equal(r.data.field, field, `${path} ${field}`);
  }
  const settings = (await api("GET", "/api/settings", f.admin)).data;
  const vat = await api("PATCH", "/api/settings", f.admin, { vat_rate: "101", updated_at: settings.updated_at });
  assert.equal(vat.code, 400);
  assert.equal((await api("GET", "/api/orders/abc", f.manager)).code, 400);
  assert.equal((await api("GET", "/api/orders/999999", f.manager)).code, 404);
});

test("an order for a car that belongs to someone else is refused", async () => {
  const a = await newCustomer(f.manager);
  const b = await newCustomer(f.manager);
  const r = await api("POST", "/api/orders", f.manager, {
    customer_id: a.customer.customer_id, vehicle_id: b.vehicle.vehicle_id, lines: [{ service_id: f.oil.service_id }],
  });
  assert.equal(r.code, 400);
});

test("a failed order save leaves nothing behind (roll-back)", async () => {
  const { customer, vehicle } = await newCustomer(f.manager);
  const [{ n: ordersBefore }] = await sql("SELECT COUNT(*) AS n FROM orders");
  const [{ n: linesBefore }] = await sql("SELECT COUNT(*) AS n FROM order_lines");
  const r = await api("POST", "/api/orders", f.manager, {
    customer_id: customer.customer_id, vehicle_id: vehicle.vehicle_id,
    lines: [{ service_id: f.oil.service_id }, { service_id: 999999 }],
  });
  assert.ok(r.code >= 400 && r.code < 500, `got ${r.code}`);
  const [{ n: ordersAfter }] = await sql("SELECT COUNT(*) AS n FROM orders");
  const [{ n: linesAfter }] = await sql("SELECT COUNT(*) AS n FROM order_lines");
  assert.equal(ordersAfter, ordersBefore);
  assert.equal(linesAfter, linesBefore);
});

test("saving over someone else's newer change gets 409", async () => {
  const { customer } = await newCustomer(f.manager);
  const loaded = (await api("GET", `/api/customers/${customer.customer_id}`, f.manager)).data;
  const first = await api("PATCH", `/api/customers/${customer.customer_id}`, f.manager, { phone: "0977000001", updated_at: loaded.updated_at });
  assert.equal(first.code, 200);
  const second = await api("PATCH", `/api/customers/${customer.customer_id}`, f.admin, { phone: "0977000002", updated_at: loaded.updated_at });
  assert.equal(second.code, 409);
  const now = (await api("GET", `/api/customers/${customer.customer_id}`, f.manager)).data;
  assert.equal(now.phone, "0977000001");
});

test("VIN is optional, up to 32 characters, and may repeat", async () => {
  const { customer } = await newCustomer(f.manager);
  const add = (plate, vin) => api("POST", "/api/vehicles", f.manager, { customer_id: customer.customer_id, make: "Lada", model: "Niva", plate, vin });
  assert.equal((await add("VN-1", "ke70123456")).data.vin, "KE70123456");
  assert.equal((await add("VN-2", "KE70123456")).code, 201);
  assert.equal((await add("VN-3", "X".repeat(33))).code, 400);
});
