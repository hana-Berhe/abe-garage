// BE-024 car service history by page, and BE-038 the technician work note address.
import { test } from "node:test";
import assert from "node:assert/strict";
import { useApp, api, sql, newCustomer, completeOrder } from "./helpers.js";

const f = useApp();

const orderFor = async (customer, vehicle, services) => {
  const r = await api("POST", "/api/orders", f.manager, {
    customer_id: customer.customer_id, vehicle_id: vehicle.vehicle_id, lines: services.map((s) => ({ service_id: s.service_id })),
  });
  return (await api("GET", `/api/orders/${r.data.order_id}`, f.manager)).data;
};

test("a car's orders come newest first, one page at a time, with saved prices (BE-024)", async () => {
  const { customer, vehicle } = await newCustomer(f.manager);
  const ids = [];
  for (let i = 0; i < 12; i++) ids.push((await orderFor(customer, vehicle, [f.oil, f.brakes])).order_id);
  await sql("UPDATE order_lines SET line_price = '45.00' WHERE order_id = ? AND service_id = ?", [ids[11], f.oil.service_id]);

  const first = await api("GET", `/api/vehicles/${vehicle.vehicle_id}/orders`, f.tech);
  assert.equal(first.code, 200);
  assert.equal(first.data.total, 12);
  assert.equal(first.data.pages, 2);
  assert.equal(first.data.rows.length, 10);
  assert.equal(first.data.rows[0].order_id, ids[11]);
  assert.deepEqual(first.data.rows[0].jobs, [
    { service_name: "Oil change", line_price: "45.00" },
    { service_name: "Brakes", line_price: "180.00" },
  ]);
  assert.equal(first.data.rows[0].customer_name, `${customer.first_name} ${customer.last_name}`);

  const second = await api("GET", `/api/vehicles/${vehicle.vehicle_id}/orders?page=2`, f.manager);
  assert.deepEqual(second.data.rows.map((o) => o.order_id), [ids[1], ids[0]]);

  assert.equal((await api("GET", "/api/vehicles/999999/orders", f.manager)).code, 404);
  assert.equal((await api("GET", "/api/vehicles/abc/orders", f.manager)).code, 400);
});

test("work notes: assigned technician or office, only once approved, written to history (BE-038)", async () => {
  const { customer, vehicle } = await newCustomer(f.manager);
  const order = await orderFor(customer, vehicle, [f.oil]);
  const line = order.lines[0];
  const note = (token, technician_note) => api("PATCH", `/api/order-lines/${line.line_id}/note`, token, { technician_note });

  assert.equal((await note(f.manager, "Too early")).code, 409);
  await api("PATCH", `/api/orders/${order.order_id}/approval`, f.manager, { decision: "approve", method: "phone" });
  await api("PATCH", `/api/order-lines/${line.line_id}/technician`, f.manager, { technician_id: f.techId });

  assert.equal((await note(f.tech2, "Not my job")).code, 403);
  const saved = await note(f.tech, "Pads worn, replaced");
  assert.equal(saved.code, 200);
  assert.deepEqual(saved.data, { line_id: line.line_id, technician_note: "Pads worn, replaced" });
  assert.equal((await note(f.manager, "Checked by the desk")).code, 200);
  assert.equal((await note(f.tech, "x".repeat(2001))).code, 400);
  assert.equal((await api("PATCH", "/api/order-lines/999999/note", f.manager, { technician_note: "x" })).code, 404);

  const [row] = await sql("SELECT technician_note, line_status FROM order_lines WHERE line_id = ?", [line.line_id]);
  assert.equal(row.technician_note, "Checked by the desk");
  assert.equal(row.line_status, 0);
  const [{ n }] = await sql("SELECT COUNT(*) AS n FROM order_history WHERE order_id = ? AND action = 'note_saved'", [order.order_id]);
  assert.equal(n, 2);

  const status = await api("GET", `/api/public/orders/${order.order_hash}`);
  assert.ok(!JSON.stringify(status.data).includes("Checked by the desk"));
});

test("a declined order takes no notes; a completed one does", async () => {
  const { customer, vehicle } = await newCustomer(f.manager);
  const declined = await orderFor(customer, vehicle, [f.oil]);
  await api("PATCH", `/api/orders/${declined.order_id}/approval`, f.manager, { decision: "decline", method: "phone" });
  assert.equal((await api("PATCH", `/api/order-lines/${declined.lines[0].line_id}/note`, f.manager, { technician_note: "x" })).code, 409);

  const done = await orderFor(customer, vehicle, [f.brakes]);
  await completeOrder(f, done);
  const r = await api("PATCH", `/api/order-lines/${done.lines[0].line_id}/note`, f.tech, { technician_note: "Test drive OK" });
  assert.equal(r.code, 200);
});

test("a started job can still be finished with a note while extra work waits for the customer", async () => {
  const { customer, vehicle } = await newCustomer(f.manager);
  const order = await orderFor(customer, vehicle, [f.oil]);
  const line = order.lines[0];
  await api("PATCH", `/api/orders/${order.order_id}/approval`, f.manager, { decision: "approve", method: "phone" });
  await api("PATCH", `/api/order-lines/${line.line_id}/technician`, f.manager, { technician_id: f.techId });
  await api("PATCH", `/api/order-lines/${line.line_id}/status`, f.tech, { status: 1, note: "Started" });
  await api("POST", `/api/orders/${order.order_id}/lines`, f.manager, { service_id: f.align.service_id });
  const r = await api("PATCH", `/api/order-lines/${line.line_id}/status`, f.tech, { status: 2, note: "Done, extra work found" });
  assert.equal(r.code, 200);
  const [row] = await sql("SELECT technician_note, line_status FROM order_lines WHERE line_id = ?", [line.line_id]);
  assert.deepEqual({ ...row }, { technician_note: "Done, extra work found", line_status: 2 });
});
