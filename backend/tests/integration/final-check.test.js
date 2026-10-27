// The six bugs from the v4 audit and the three tasks it found partly built (BE-025, BE-030, BE-032).
import { test } from "node:test";
import assert from "node:assert/strict";
import { useApp, api, newCustomer, newOrder, completeOrder, errorField } from "./helpers.js";

const f = useApp();

test("payment takes { paid: true } or no body, and nothing else (BE-042)", async () => {
  const a = await newOrder(f.manager, f, [f.oil]);
  await completeOrder(f, a);
  await api("POST", `/api/orders/${a.order_id}/invoice`, f.manager);
  const no = await api("PATCH", `/api/orders/${a.order_id}/payment`, f.manager, { paid: false });
  assert.equal(no.code, 400);
  assert.equal(errorField(no), "paid");
  const yes = await api("PATCH", `/api/orders/${a.order_id}/payment`, f.manager, { paid: true });
  assert.equal(yes.code, 200);
  assert.equal(yes.data.paid, 1);

  const b = await newOrder(f.manager, f, [f.oil]);
  await completeOrder(f, b);
  await api("POST", `/api/orders/${b.order_id}/invoice`, f.manager);
  assert.equal((await api("PATCH", `/api/orders/${b.order_id}/payment`, f.manager)).code, 200, "no body still works");
});

test("prices with more than two decimals are refused, not rounded (BE-025)", async () => {
  const s = await api("POST", "/api/services", f.admin, { name: "Odd price", price: "1.005" });
  assert.equal(s.code, 400);
  assert.equal(errorField(s), "price");
  assert.equal((await api("POST", "/api/services", f.admin, { name: "Whole price", price: 25 })).code, 201);
  const { customer, vehicle } = await newCustomer(f.manager);
  const o = await api("POST", "/api/orders", f.manager, {
    customer_id: customer.customer_id, vehicle_id: vehicle.vehicle_id, lines: [{ description: "Bulb", price: "3.999" }],
  });
  assert.equal(o.code, 400);
  assert.equal(errorField(o), "price");
});

test("a body over 256 KB gets 413, not a server error (BE-001)", async () => {
  const ok = await api("POST", "/api/customers", f.manager, { first_name: "x".repeat(200 * 1024), last_name: "y" });
  assert.equal(ok.code, 400, "200 KB reaches the normal checks");
  const big = await api("POST", "/api/customers", f.manager, { first_name: "x".repeat(300 * 1024), last_name: "y" });
  assert.equal(big.code, 413);
  assert.equal(big.status, "error");
});

test("a completed order keeps its ready date, but notes can still change (BE-032)", async () => {
  const order = await newOrder(f.manager, f, [f.oil]);
  await completeOrder(f, order);
  const done = (await api("GET", `/api/orders/${order.order_id}`, f.manager)).data;
  const date = await api("PATCH", `/api/orders/${order.order_id}`, f.manager, { estimated_ready_date: "2099-01-01", updated_at: done.updated_at });
  assert.equal(date.code, 409);
  assert.equal(errorField(date), "estimated_ready_date");
  const note = await api("PATCH", `/api/orders/${order.order_id}`, f.manager, { notes_for_customer: "Collected", updated_at: done.updated_at });
  assert.equal(note.code, 200);
});

test("search treats % and _ as plain characters", async () => {
  const all = (await api("GET", "/api/customers", f.manager)).data.total;
  assert.ok(all > 0);
  assert.equal((await api("GET", "/api/customers?search=%25", f.manager)).data.total, 0);
  assert.equal((await api("GET", "/api/customers?search=_", f.manager)).data.total, 0);
  assert.equal((await api("GET", "/api/orders?search=%25", f.manager)).data.total, 0);
  assert.equal((await api("GET", "/api/employees?search=_", f.admin)).data.total, 0);
});

test("orders filter by customer, car, paid and unpaid_only (BE-030)", async () => {
  const one = await newOrder(f.manager, f, [f.oil]);
  const two = await newOrder(f.manager, f, [f.brakes]);
  await completeOrder(f, two);
  const ids = (r) => r.data.rows.map((o) => o.order_id);

  const byCustomer = await api("GET", `/api/orders?customer_id=${one.customer_id}`, f.manager);
  assert.deepEqual(ids(byCustomer), [one.order_id]);
  const byCar = await api("GET", `/api/orders?vehicle_id=${two.vehicle_id}`, f.manager);
  assert.deepEqual(ids(byCar), [two.order_id]);

  const unpaidOnly = await api("GET", "/api/orders?unpaid_only=true", f.manager);
  assert.ok(ids(unpaidOnly).includes(two.order_id));
  assert.ok(unpaidOnly.data.rows.every((o) => o.status === 4 && o.paid === 0));
  // paid=false alone also includes orders that aren't completed yet.
  const unpaid = await api("GET", "/api/orders?paid=false", f.manager);
  assert.ok(ids(unpaid).includes(one.order_id) && ids(unpaid).includes(two.order_id));

  assert.equal((await api("GET", "/api/orders?unpaid_only=true&paid=true", f.manager)).code, 400);
  assert.equal((await api("GET", "/api/orders?unpaid_only=true&status=1", f.manager)).code, 400);
  assert.equal((await api("GET", "/api/orders?paid=maybe", f.manager)).code, 400);
  assert.equal((await api("GET", "/api/orders?customer_id=abc", f.manager)).code, 400);
});
