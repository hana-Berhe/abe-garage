// BE-049 (5): money is exact, and an issued invoice never changes afterwards.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { useApp, api, newOrder, completeOrder } = require("./helpers");

const f = useApp();

test("VAT: 230.00 → 34.50 → 264.50, and cent edge cases round half up", async () => {
  const order = await newOrder(f.manager, f, [f.oil, f.brakes]);
  assert.deepEqual([order.subtotal, order.vat_rate, order.vat_amount, order.total], ["230.00", "15.00", "34.50", "264.50"]);

  const cheap = async (name, price) => (await api("POST", "/api/services", f.admin, { name, price })).data;
  const cent = await cheap("One cent", "0.01");
  const dime = await cheap("Ten cents", "0.10");
  const twenty = await cheap("Twenty cents", "0.20");
  const one = await newOrder(f.manager, f, [cent]);
  assert.deepEqual([one.subtotal, one.vat_amount, one.total], ["0.01", "0.00", "0.01"], "0.0015 rounds down");
  const ten = await newOrder(f.manager, f, [dime]);
  assert.deepEqual([ten.subtotal, ten.vat_amount, ten.total], ["0.10", "0.02", "0.12"], "0.015 rounds up");
  const sum = await newOrder(f.manager, f, [dime, twenty]);
  assert.equal(sum.subtotal, "0.30", "0.1 + 0.2 is exactly 0.30");
  assert.equal(sum.vat_amount, "0.05");
});

test("a new VAT rate applies to new orders only", async () => {
  const before = await newOrder(f.manager, f, [f.oil]);
  let s = (await api("GET", "/api/settings", f.admin)).data;
  s = (await api("PATCH", "/api/settings", f.admin, { vat_rate: "10", updated_at: s.updated_at })).data;
  const afterChange = await newOrder(f.manager, f, [f.oil]);
  const old = (await api("GET", `/api/orders/${before.order_id}`, f.manager)).data;
  assert.equal(old.vat_rate, "15.00");
  assert.equal(old.total, "57.50");
  assert.equal(afterChange.vat_rate, "10.00");
  assert.equal(afterChange.total, "55.00");
  await api("PATCH", "/api/settings", f.admin, { vat_rate: "15", updated_at: s.updated_at });
});

test("an issued invoice stays the same after prices, garage, customer and car change", async () => {
  const order = await newOrder(f.manager, f, [f.oil, f.brakes]);
  await completeOrder(f, order);
  const issued = (await api("POST", `/api/orders/${order.order_id}/invoice`, f.manager)).data;
  const before = (await api("GET", `/api/orders/${order.order_id}/invoice`, f.manager)).data;

  const oil = (await api("GET", "/api/services", f.admin)).data.find((x) => x.service_id === f.oil.service_id);
  assert.equal((await api("PATCH", `/api/services/${oil.service_id}`, f.admin, { name: "Synthetic oil change", price: "99.00", updated_at: oil.updated_at })).code, 200);
  const s = (await api("GET", "/api/settings", f.admin)).data;
  assert.equal((await api("PATCH", "/api/settings", f.admin, { name: "New Garage Name", address: "Somewhere else", phone: "0100000000", updated_at: s.updated_at })).code, 200);
  const c = (await api("GET", `/api/customers/${order.customer_id}`, f.manager)).data;
  assert.equal((await api("PATCH", `/api/customers/${order.customer_id}`, f.manager, { first_name: "Changed", phone: "0988000000", updated_at: c.updated_at })).code, 200);
  const v = (await api("GET", `/api/vehicles/${order.vehicle_id}`, f.manager)).data;
  assert.equal((await api("PATCH", `/api/vehicles/${order.vehicle_id}`, f.manager, { plate: "ZZ-9999", updated_at: v.updated_at })).code, 200);

  const after = (await api("GET", `/api/orders/${order.order_id}/invoice`, f.manager)).data;
  assert.equal(after.invoice_number, issued.invoice_number);
  assert.deepEqual(after.garage, before.garage);
  assert.deepEqual(after.lines, before.lines);
  assert.equal(after.first_name, before.first_name);
  assert.equal(after.plate, before.plate);
  assert.equal(after.total, "264.50");
  assert.notEqual(after.garage.name, "New Garage Name");
});

test("the invoice can't be issued until the approved total matches and every job is done", async () => {
  const order = await newOrder(f.manager, f, [f.oil]);
  assert.equal((await api("POST", `/api/orders/${order.order_id}/invoice`, f.manager)).code, 409);
  assert.equal((await api("GET", `/api/orders/${order.order_id}/invoice`, f.manager)).code, 404);
});
