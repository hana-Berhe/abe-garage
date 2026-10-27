// BE-049 (7): with 1000 orders the lists stay under 2 seconds, pages add up, and "today" follows the garage clock.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const { useApp, api, sql, newCustomer } = require("./helpers");
const { periodStarts } = require("../../src/shared/time");

const f = useApp();
const ORDERS = 1000;

async function seedOrders() {
  const cars = [];
  for (let i = 0; i < 20; i++) cars.push(await newCustomer(f.manager));
  const rows = [];
  const old = new Date(Date.now() - 60 * 24 * 3600 * 1000);
  for (let i = 0; i < ORDERS; i++) {
    const { customer, vehicle } = cars[i % cars.length];
    const status = (i % 5) + 1;
    const paid = status === 4 && i % 2 === 0 ? 1 : 0;
    rows.push([customer.customer_id, vehicle.vehicle_id, f.managerId, status, crypto.randomBytes(16).toString("hex"),
      "50.00", "15.00", "7.50", "57.50", paid, paid ? old : null, status === 4 ? old : null]);
  }
  await sql(
    `INSERT INTO orders (customer_id, vehicle_id, created_by, status, order_hash, subtotal, vat_rate, vat_amount, total, paid, paid_at, completed_at)
     VALUES ?`,
    [rows]
  );
}

const timed = async (fn) => {
  const start = process.hrtime.bigint();
  const result = await fn();
  return { result, ms: Number(process.hrtime.bigint() - start) / 1e6 };
};

test("lists with 1000 orders answer in under 2 seconds and the pages add up", async () => {
  await seedOrders();
  const [{ n }] = await sql("SELECT COUNT(*) AS n FROM orders");
  assert.ok(n >= ORDERS);

  const list = await timed(() => api("GET", "/api/orders", f.manager));
  assert.equal(list.result.code, 200);
  assert.ok(list.ms < 2000, `order list took ${list.ms} ms`);
  assert.equal(list.result.data.total, n);
  assert.equal(list.result.data.pages, Math.ceil(n / list.result.data.page_size));

  const lastPage = await api("GET", `/api/orders?page=${list.result.data.pages}`, f.manager);
  assert.equal(lastPage.data.rows.length, n - (list.result.data.pages - 1) * list.result.data.page_size);

  const filtered = await timed(() => api("GET", "/api/orders?status=4", f.manager));
  assert.ok(filtered.ms < 2000);
  const [{ c }] = await sql("SELECT COUNT(*) AS c FROM orders WHERE status = 4");
  assert.equal(filtered.result.data.total, c);

  const searched = await timed(() => api("GET", "/api/orders?search=AA-", f.manager));
  assert.ok(searched.ms < 2000);
  for (const path of ["/api/customers", "/api/dashboard"]) {
    const r = await timed(() => api("GET", path, f.manager));
    assert.equal(r.result.code, 200);
    assert.ok(r.ms < 2000, `${path} took ${r.ms} ms`);
  }
});

test("dashboard 'today' starts at midnight in the garage's time zone", async () => {
  const { today } = periodStarts();
  const before = (await api("GET", "/api/dashboard", f.manager)).data;
  const { customer, vehicle } = await newCustomer(f.manager);
  const insert = (paidAt, total) =>
    sql(
      `INSERT INTO orders (customer_id, vehicle_id, created_by, status, order_hash, subtotal, vat_rate, vat_amount, total, paid, paid_at, completed_at)
       VALUES (?, ?, ?, 4, ?, ?, '15.00', '0.00', ?, 1, ?, ?)`,
      [customer.customer_id, vehicle.vehicle_id, f.managerId, crypto.randomBytes(16).toString("hex"), total, total, paidAt, paidAt]
    );
  await insert(new Date(today.getTime() + 60 * 1000), "100.00"); // one minute after local midnight: today
  await insert(new Date(today.getTime() - 60 * 1000), "7.00"); // one minute before: yesterday
  const after = (await api("GET", "/api/dashboard", f.manager)).data;
  assert.equal(Number(after.money_today) - Number(before.money_today), 100);
  assert.equal(after.timezone, process.env.APP_TIMEZONE);
});
