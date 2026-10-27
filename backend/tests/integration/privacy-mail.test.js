// BE-049 (3, 6): what the public can see, mail failures, and password reset.
import { test } from "node:test";
import assert from "node:assert/strict";
import { useApp, api, sql, login, newOrder, completeOrder, mail } from "./helpers.js";

const f = useApp();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test("the customer status page shows no money, surname, contact details or internal notes", async () => {
  const order = await newOrder(f.manager, f, [f.oil], { internal_notes: "SECRET-INTERNAL", notes_for_customer: "Bring the spare key" });
  const r = await api("GET", `/api/public/orders/${order.order_hash}`);
  assert.equal(r.code, 200);
  const text = JSON.stringify(r.data);
  assert.equal(r.data.first_name, order.first_name);
  for (const hidden of [order.last_name, order.email, order.phone, "SECRET-INTERNAL", order.total, "line_price", "technician_note", "internal_notes"]) {
    assert.ok(!text.includes(hidden), `status page leaks ${hidden}`);
  }
  assert.equal((await api("GET", "/api/public/orders/0000000000000000000000000000000000000000000000000000000000000000")).code, 404);
  assert.equal((await api("GET", "/api/public/orders/abc")).code, 404);
});

test("the printable estimate leaves out internal and technician notes, the link code and history", async () => {
  const order = await newOrder(f.manager, f, [f.oil], { internal_notes: "SECRET-INTERNAL" });
  const r = await api("GET", `/api/orders/${order.order_id}/estimate`, f.manager);
  const text = JSON.stringify(r.data);
  for (const hidden of ["SECRET-INTERNAL", order.order_hash, "technician_note", "history", "internal_notes"]) {
    assert.ok(!text.includes(hidden), `estimate leaks ${hidden}`);
  }
});

test("public service list and garage details carry no prices or VAT", async () => {
  const services = await api("GET", "/api/public/services");
  assert.ok(services.data.every((s) => !("price" in s)));
  const garage = await api("GET", "/api/public/garage");
  assert.ok(!("vat_rate" in garage.data));
});

test("a broken mail server never blocks saving an order or completing it", async () => {
  mail.fail = true;
  try {
    const order = await newOrder(f.manager, f, [f.oil]);
    assert.ok(order.order_id, "order saved");
    const done = await completeOrder(f, order);
    assert.equal(done.status, 4, "order completed");
    await wait(200);
    const rows = await sql("SELECT action FROM order_history WHERE order_id = ? AND action LIKE 'email_%'", [order.order_id]);
    assert.ok(rows.length >= 2 && rows.every((x) => x.action === "email_failed"), "failures written to history");
    const resend = await api("POST", `/api/orders/${order.order_id}/resend-email`, f.manager);
    assert.equal(resend.code, 200);
    assert.equal(resend.data.sent, false);
  } finally {
    mail.fail = false;
  }
});

test("forgot password gives the same answer for every email and emails only active staff", async () => {
  const answers = [];
  const before = mail.sent.length;
  for (const email of ["nobody@test.local", "manager@test.local"]) {
    const r = await api("POST", "/api/auth/forgot-password", null, { email });
    answers.push([r.code, r.message, r.data]);
  }
  assert.deepEqual(answers[0], answers[1]);
  await wait(200);
  assert.equal(mail.sent.length - before, 1);
  assert.equal(mail.sent.at(-1).to, "manager@test.local");
  const [{ n }] = await sql("SELECT COUNT(*) AS n FROM password_reset_tokens");
  assert.equal(n, 1);
  const token = mail.sent.at(-1).text.match(/token=([0-9a-f]{64})/)[1];
  const [stored] = await sql("SELECT token_hash FROM password_reset_tokens");
  assert.notEqual(stored.token_hash, token, "only the hash is stored");
});

test("resetting the password signs out old sessions; used and expired links are refused", async () => {
  const old = await login("tech@test.local");
  await api("POST", "/api/auth/forgot-password", null, { email: "tech@test.local" });
  await wait(200);
  const token = mail.sent.at(-1).text.match(/token=([0-9a-f]{64})/)[1];
  const r = await api("POST", "/api/auth/reset-password", null, { token, new_password: "Brandnew123" });
  assert.equal(r.code, 200);
  assert.equal((await api("GET", "/api/my-jobs", old)).code, 401);
  assert.equal((await api("POST", "/api/auth/reset-password", null, { token, new_password: "Again12345" })).code, 400);
  await login("tech@test.local", "Brandnew123");

  await api("POST", "/api/auth/forgot-password", null, { email: "tech2@test.local" });
  await wait(200);
  const late = mail.sent.at(-1).text.match(/token=([0-9a-f]{64})/)[1];
  await sql("UPDATE password_reset_tokens SET expires_at = UTC_TIMESTAMP() - INTERVAL 1 MINUTE WHERE used_at IS NULL");
  assert.equal((await api("POST", "/api/auth/reset-password", null, { token: late, new_password: "Brandnew123" })).code, 400);
});
