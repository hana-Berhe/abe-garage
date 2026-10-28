// Approvals, invoices and cash payments live in their own tables, not as columns on orders.
import { test } from "node:test";
import assert from "node:assert/strict";
import { useApp, api, sql, newOrder, completeOrder } from "./helpers.js";

const f = useApp();

test("orders keep no approval, invoice or payment columns", async () => {
  const columns = (await sql("SHOW COLUMNS FROM orders")).map((c) => c.Field);
  for (const gone of ["approved_by", "approval_method", "paid", "paid_at", "invoice_number", "invoice_snapshot"]) {
    assert.ok(!columns.includes(gone), `orders.${gone} should not exist`);
  }
});

test("each answer from the customer is its own approval row with the total they answered", async () => {
  const order = await newOrder(f.manager, f, [f.oil]);
  await api("PATCH", `/api/orders/${order.order_id}/approval`, f.manager, { decision: "approve", method: "phone" });
  const added = await api("POST", `/api/orders/${order.order_id}/lines`, f.manager, { service_id: f.brakes.service_id });
  assert.equal(added.code, 201);
  await api("PATCH", `/api/orders/${order.order_id}/approval`, f.manager, { decision: "approve", method: "in_person", note: "Agreed at the desk" });

  const rows = await sql(
    "SELECT decision, approval_method, order_total, note FROM order_approvals WHERE order_id = ? ORDER BY approval_id",
    [order.order_id]
  );
  assert.deepEqual(
    rows.map((r) => [r.decision, r.approval_method, r.order_total, r.note]),
    [["approved", "phone", "57.50", null], ["approved", "in_person", "264.50", "Agreed at the desk"]]
  );
  const latest = (await api("GET", `/api/orders/${order.order_id}`, f.manager)).data;
  assert.equal(latest.approval_method, "in_person");
  assert.ok(latest.approved_by_name);

  const declined = await newOrder(f.manager, f, [f.oil]);
  await api("PATCH", `/api/orders/${declined.order_id}/approval`, f.manager, { decision: "decline", method: "phone" });
  const [no] = await sql("SELECT decision, order_total FROM order_approvals WHERE order_id = ?", [declined.order_id]);
  assert.deepEqual([no.decision, no.order_total], ["declined", "57.50"]);
});

test("issuing and paying adds one invoice row and one cash payment row", async () => {
  const order = await newOrder(f.manager, f, [f.oil, f.brakes]);
  await completeOrder(f, order);
  assert.equal((await api("POST", `/api/orders/${order.order_id}/invoice`, f.manager)).code, 201);
  const unpaid = (await api("GET", `/api/orders?paid=false&customer_id=${order.customer_id}`, f.manager)).data;
  assert.deepEqual(unpaid.rows.map((o) => o.order_id), [order.order_id]);

  const paid = await api("PATCH", `/api/orders/${order.order_id}/payment`, f.manager, { paid: true });
  assert.equal(paid.code, 200);
  assert.equal(paid.data.paid, 1);
  assert.equal((await api("PATCH", `/api/orders/${order.order_id}/payment`, f.manager, { paid: true })).code, 409);

  const [inv] = await sql("SELECT invoice_id, invoice_number, customer_first_name FROM invoices WHERE order_id = ?", [order.order_id]);
  assert.equal(inv.invoice_number, paid.data.invoice_number);
  assert.equal(inv.customer_first_name, order.first_name);
  const payments = await sql("SELECT received_by FROM cash_payments WHERE invoice_id = ?", [inv.invoice_id]);
  assert.equal(payments.length, 1);

  const detail = (await api("GET", `/api/orders/${order.order_id}`, f.manager)).data;
  assert.equal(detail.paid, 1);
  assert.equal(detail.invoice_number, inv.invoice_number);
  const done = (await api("GET", `/api/orders?paid=true&customer_id=${order.customer_id}`, f.manager)).data;
  assert.deepEqual(done.rows.map((o) => o.order_id), [order.order_id]);
});
