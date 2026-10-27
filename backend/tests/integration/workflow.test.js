// BE-049 (2): the whole visit, from new customer to cash payment and the customer's status page.
import { test } from "node:test";
import assert from "node:assert/strict";
import { useApp, api, newCustomer, completeOrder, mail } from "./helpers.js";

const f = useApp();

test("new customer → car → estimate → approval → jobs → invoice → cash → status page", async () => {
  const { customer, vehicle } = await newCustomer(f.manager);
  const created = await api("POST", "/api/orders", f.manager, {
    customer_id: customer.customer_id,
    vehicle_id: vehicle.vehicle_id,
    lines: [{ service_id: f.oil.service_id }, { service_id: f.brakes.service_id }],
    notes_for_customer: "Call before extra work",
    internal_notes: "Front pads worn",
  });
  assert.equal(created.code, 201);
  // VAT example from the PRD: 230.00 + 15% = 34.50, total 264.50.
  assert.equal(created.data.subtotal, "230.00");
  assert.equal(created.data.vat_amount, "34.50");
  assert.equal(created.data.total, "264.50");
  const id = created.data.order_id;
  assert.ok(mail.sent.some((m) => m.to === customer.email && /order-status\//.test(m.text)), "status link emailed");

  const estimate = await api("GET", `/api/orders/${id}/estimate`, f.manager);
  assert.equal(estimate.code, 200);
  assert.equal(estimate.data.estimate_number, `EST-${id}`);
  assert.equal(estimate.data.total, "264.50");

  const order = (await api("GET", `/api/orders/${id}`, f.manager)).data;
  const done = await completeOrder(f, order);
  assert.equal(done.status, 4, "last job done completes the order");
  assert.ok(mail.sent.some((m) => m.to === customer.email && /ready/i.test(m.subject)), "car-ready email sent");

  const issued = await api("POST", `/api/orders/${id}/invoice`, f.manager);
  assert.equal(issued.code, 201);
  assert.match(issued.data.invoice_number, /^INV-/);
  const paid = await api("PATCH", `/api/orders/${id}/payment`, f.manager);
  assert.equal(paid.code, 200);
  assert.equal(paid.data.paid, 1);

  const status = await api("GET", `/api/public/orders/${order.order_hash}`);
  assert.equal(status.code, 200);
  assert.equal(status.data.status, 4);
  assert.equal(status.data.paid, 1);
});

test("a declined order blocks work, invoice and payment", async () => {
  const { customer, vehicle } = await newCustomer(f.manager);
  const created = await api("POST", "/api/orders", f.manager, {
    customer_id: customer.customer_id,
    vehicle_id: vehicle.vehicle_id,
    lines: [{ service_id: f.oil.service_id }],
  });
  const id = created.data.order_id;
  const order = (await api("GET", `/api/orders/${id}`, f.manager)).data;
  const declined = await api("PATCH", `/api/orders/${id}/approval`, f.manager, { decision: "decline", method: "phone" });
  assert.equal(declined.code, 200);
  assert.equal(declined.data.status, 5);

  const lineId = order.lines[0].line_id;
  const r = {
    assign: await api("PATCH", `/api/order-lines/${lineId}/technician`, f.manager, { technician_id: f.techId }),
    start: await api("PATCH", `/api/order-lines/${lineId}/status`, f.manager, { status: 1 }),
    invoice: await api("POST", `/api/orders/${id}/invoice`, f.manager),
    pay: await api("PATCH", `/api/orders/${id}/payment`, f.manager),
    edit: await api("PATCH", `/api/orders/${id}`, f.manager, { notes_for_customer: "x", updated_at: declined.data.updated_at }),
  };
  assert.equal(r.assign.code, 400);
  assert.equal(r.start.code, 400);
  assert.equal(r.invoice.code, 409);
  assert.equal(r.pay.code, 409);
  assert.equal(r.edit.code, 400);
  assert.match(r.edit.message, /declined/i);
});

test("no work starts before approval", async () => {
  const { customer, vehicle } = await newCustomer(f.manager);
  const created = await api("POST", "/api/orders", f.manager, {
    customer_id: customer.customer_id, vehicle_id: vehicle.vehicle_id, lines: [{ service_id: f.oil.service_id }],
  });
  const order = (await api("GET", `/api/orders/${created.data.order_id}`, f.manager)).data;
  const lineId = order.lines[0].line_id;
  await api("PATCH", `/api/order-lines/${lineId}/technician`, f.manager, { technician_id: f.techId });
  const start = await api("PATCH", `/api/order-lines/${lineId}/status`, f.tech, { status: 1 });
  assert.equal(start.code, 400);
  assert.match(start.message, /approves/);
});
