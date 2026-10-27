// BE-049 (4): two people pressing the same button at the same moment.
import { test } from "node:test";
import assert from "node:assert/strict";
import { useApp, api, sql, login, newOrder, completeOrder, mail } from "./helpers.js";

const f = useApp();

const codes = (results) => results.map((r) => r.code).sort((a, b) => a - b);

test("two jobs finished at once complete the order exactly once", async () => {
  const order = await newOrder(f.manager, f, [f.oil, f.brakes]);
  await api("PATCH", `/api/orders/${order.order_id}/approval`, f.manager, { decision: "approve", method: "phone" });
  const [a, b] = order.lines;
  await api("PATCH", `/api/order-lines/${a.line_id}/technician`, f.manager, { technician_id: f.techId });
  await api("PATCH", `/api/order-lines/${b.line_id}/technician`, f.manager, { technician_id: f.tech2Id });
  await api("PATCH", `/api/order-lines/${a.line_id}/status`, f.tech, { status: 1 });
  await api("PATCH", `/api/order-lines/${b.line_id}/status`, f.tech2, { status: 1 });
  const before = mail.sent.length;
  const results = await Promise.all([
    api("PATCH", `/api/order-lines/${a.line_id}/status`, f.tech, { status: 2 }),
    api("PATCH", `/api/order-lines/${b.line_id}/status`, f.tech2, { status: 2 }),
  ]);
  assert.deepEqual(codes(results), [200, 200]);
  const [row] = await sql("SELECT status FROM orders WHERE order_id = ?", [order.order_id]);
  assert.equal(row.status, 4);
  const [{ n }] = await sql("SELECT COUNT(*) AS n FROM order_history WHERE order_id = ? AND action = 'completed'", [order.order_id]);
  assert.equal(n, 1, "one 'completed' entry");
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(mail.sent.length - before, 1, "one car-ready email");
});

test("two admins demoting each other at once still leave one active admin", async () => {
  await api("POST", "/api/employees", f.admin, { email: "admin2@test.local", first_name: "Second", last_name: "Admin", password: "Password123", role_id: 3 });
  const admins = await sql("SELECT employee_id FROM employees WHERE role_id = 3 AND active = 1 ORDER BY employee_id");
  assert.equal(admins.length, 2);
  const [first, second] = await Promise.all(admins.map((a) => api("GET", `/api/employees/${a.employee_id}`, f.admin)));
  const admin2 = await login("admin2@test.local");
  // Each admin demotes the other at the same moment.
  const results = await Promise.all([
    api("PATCH", `/api/employees/${second.data.employee_id}`, f.admin, { role_id: 2, updated_at: second.data.updated_at }),
    api("PATCH", `/api/employees/${first.data.employee_id}`, admin2, { role_id: 2, updated_at: first.data.updated_at }),
  ]);
  const [ok, refused] = codes(results);
  assert.equal(ok, 200);
  // The loser is refused: 409 (last admin) or 401 (already demoted, so signed out).
  assert.ok([401, 409].includes(refused), `got ${refused}`);
  const [{ n }] = await sql("SELECT COUNT(*) AS n FROM employees WHERE role_id = 3 AND active = 1");
  assert.equal(n, 1);
});

test("issuing an invoice twice gives the same invoice, paying twice is refused", async () => {
  const order = await newOrder(f.manager, f, [f.oil]);
  await completeOrder(f, order);
  const issued = await Promise.all([1, 2, 3].map(() => api("POST", `/api/orders/${order.order_id}/invoice`, f.manager)));
  assert.deepEqual(codes(issued), [200, 200, 201]);
  assert.equal(new Set(issued.map((r) => r.data.invoice_number)).size, 1);
  const paid = await Promise.all([1, 2].map(() => api("PATCH", `/api/orders/${order.order_id}/payment`, f.manager)));
  assert.deepEqual(codes(paid), [200, 409]);
  const [{ n }] = await sql("SELECT COUNT(*) AS n FROM order_history WHERE order_id = ? AND action = 'paid'", [order.order_id]);
  assert.equal(n, 1);
});

test("one reset link used twice at once: exactly one wins", async () => {
  await api("POST", "/api/auth/forgot-password", null, { email: "tech2@test.local" });
  await new Promise((r) => setTimeout(r, 200));
  const token = mail.sent.at(-1).text.match(/token=([0-9a-f]{64})/)[1];
  const results = await Promise.all([
    api("POST", "/api/auth/reset-password", null, { token, new_password: "FirstPass123" }),
    api("POST", "/api/auth/reset-password", null, { token, new_password: "SecondPass123" }),
  ]);
  assert.deepEqual(codes(results), [200, 400]);
});

test("while extra work waits for a yes, started jobs can finish but nothing new starts", async () => {
  const order = await newOrder(f.manager, f, [f.oil, f.brakes]);
  await api("PATCH", `/api/orders/${order.order_id}/approval`, f.manager, { decision: "approve", method: "phone" });
  const [a, b] = order.lines;
  for (const l of order.lines) await api("PATCH", `/api/order-lines/${l.line_id}/technician`, f.manager, { technician_id: f.techId });
  await api("PATCH", `/api/order-lines/${a.line_id}/status`, f.tech, { status: 1 });
  const extra = await api("POST", `/api/orders/${order.order_id}/lines`, f.manager, { service_id: f.align.service_id });
  assert.equal(extra.data.status, 1, "back to awaiting approval");
  const jobs = (await api("GET", "/api/my-jobs", f.tech)).data;
  assert.ok(jobs.some((j) => j.line_id === a.line_id), "started job stays on My Jobs");
  assert.ok(!jobs.some((j) => j.line_id === b.line_id), "unstarted job is hidden while waiting");
  assert.equal((await api("PATCH", `/api/order-lines/${b.line_id}/status`, f.tech, { status: 1 })).code, 400);
  const finish = await api("PATCH", `/api/order-lines/${a.line_id}/status`, f.tech, { status: 2 });
  assert.equal(finish.code, 200);
  assert.equal(finish.data.status, 1, "still waiting for the yes");
  assert.equal((await api("POST", `/api/orders/${order.order_id}/invoice`, f.manager)).code, 409);
});
