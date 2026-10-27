// BE-049 (3): who may call what, and tokens that must stop working.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { useApp, api, login, sql } = require("./helpers");

const f = useApp();

// [method, path, roles allowed]. T technician, M manager, A admin. Ids don't need to exist: the role check comes first.
const ROUTES = [
  ["PATCH", "/api/auth/password", "TMA"],
  ["GET", "/api/profile", "TMA"],
  ["POST", "/api/employees", "A"],
  ["GET", "/api/employees", "MA"],
  ["GET", "/api/employees/1", "A"],
  ["PATCH", "/api/employees/1", "A"],
  ["GET", "/api/roles", "A"],
  ["GET", "/api/settings", "A"],
  ["PATCH", "/api/settings", "A"],
  ["POST", "/api/services", "A"],
  ["GET", "/api/services", "TMA"],
  ["PATCH", "/api/services/1", "A"],
  ["POST", "/api/customers", "MA"],
  ["GET", "/api/customers", "TMA"],
  ["GET", "/api/customers/1", "TMA"],
  ["PATCH", "/api/customers/1", "MA"],
  ["POST", "/api/vehicles", "MA"],
  ["GET", "/api/customers/1/vehicles", "TMA"],
  ["GET", "/api/vehicles/1", "TMA"],
  ["PATCH", "/api/vehicles/1", "MA"],
  ["POST", "/api/orders", "MA"],
  ["GET", "/api/orders", "TMA"],
  ["GET", "/api/orders/1", "TMA"],
  ["GET", "/api/orders/1/estimate", "MA"],
  ["PATCH", "/api/orders/1", "MA"],
  ["POST", "/api/orders/1/lines", "MA"],
  ["PATCH", "/api/orders/1/approval", "MA"],
  ["PATCH", "/api/order-lines/1/technician", "MA"],
  ["PATCH", "/api/order-lines/1/status", "TMA"],
  ["GET", "/api/my-jobs", "T"],
  ["POST", "/api/orders/1/invoice", "MA"],
  ["GET", "/api/orders/1/invoice", "MA"],
  ["PATCH", "/api/orders/1/payment", "MA"],
  ["POST", "/api/orders/1/resend-email", "MA"],
  ["GET", "/api/dashboard", "MA"],
];

test("every staff address needs a login (401)", async () => {
  for (const [method, path] of ROUTES) {
    const r = await api(method, path, null, method === "GET" ? undefined : {});
    assert.equal(r.code, 401, `${method} ${path}`);
    assert.equal(r.status, "fail");
  }
});

test("roles not allowed get 403", async () => {
  const tokens = { T: f.tech, M: f.manager, A: f.admin };
  for (const [method, path, allowed] of ROUTES) {
    for (const role of "TMA") {
      if (allowed.includes(role)) continue;
      const r = await api(method, path, tokens[role], method === "GET" ? undefined : {});
      assert.equal(r.code, 403, `${role} ${method} ${path}`);
    }
  }
});

test("bad, expired and forged tokens get 401", async () => {
  const [me] = await sql("SELECT employee_id, role_id, token_version FROM employees WHERE email = 'manager@test.local'");
  const payload = { employee_id: me.employee_id, role_id: me.role_id, token_version: me.token_version, name: "Mona Test" };
  const expired = jwt.sign({ ...payload, exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET);
  const forged = jwt.sign(payload, "not-the-secret");
  const promoted = jwt.sign({ ...payload, role_id: 3 }, "not-the-secret");
  for (const token of ["garbage", expired, forged, promoted]) {
    assert.equal((await api("GET", "/api/dashboard", token)).code, 401);
  }
});

test("the role comes from the database, not the token", async () => {
  const [me] = await sql("SELECT employee_id, token_version FROM employees WHERE email = 'tech@test.local'");
  // A correctly signed token that claims Admin for a technician still only gets technician rights.
  const claimsAdmin = jwt.sign({ employee_id: me.employee_id, role_id: 3, token_version: me.token_version, name: "x" }, process.env.JWT_SECRET);
  assert.equal((await api("GET", "/api/settings", claimsAdmin)).code, 403);
});

test("switching staff off or changing their role ends their sessions at once", async () => {
  const r = await api("POST", "/api/employees", f.admin, { email: "temp@test.local", first_name: "Temp", last_name: "Test", password: "Password123", role_id: 2 });
  const token = await login("temp@test.local");
  assert.equal((await api("GET", "/api/dashboard", token)).code, 200);
  let emp = (await api("GET", `/api/employees/${r.data.employee_id}`, f.admin)).data;
  emp = (await api("PATCH", `/api/employees/${r.data.employee_id}`, f.admin, { role_id: 1, updated_at: emp.updated_at })).data;
  assert.equal((await api("GET", "/api/my-jobs", token)).code, 401, "role change signs out");
  const token2 = await login("temp@test.local");
  await api("PATCH", `/api/employees/${r.data.employee_id}`, f.admin, { active: 0, updated_at: emp.updated_at });
  assert.equal((await api("GET", "/api/my-jobs", token2)).code, 401, "switch-off signs out");
  const again = await api("POST", "/api/auth/login", null, { email: "temp@test.local", password: "Password123" });
  assert.equal(again.code, 403, "a switched-off account can't log in");
});

test("changing your password signs out every session", async () => {
  await api("POST", "/api/employees", f.admin, { email: "pw@test.local", first_name: "Pw", last_name: "Test", password: "Password123", role_id: 1 });
  const phone = await login("pw@test.local");
  const laptop = await login("pw@test.local");
  const r = await api("PATCH", "/api/auth/password", laptop, { old_password: "Password123", new_password: "Password456" });
  assert.equal(r.code, 200);
  assert.equal((await api("GET", "/api/my-jobs", phone)).code, 401);
  assert.equal((await api("GET", "/api/my-jobs", laptop)).code, 401);
  assert.equal((await api("POST", "/api/auth/login", null, { email: "pw@test.local", password: "Password123" })).code, 401);
  await login("pw@test.local", "Password456");
});

test("a technician can only move their own jobs", async () => {
  const { newOrder } = require("./helpers");
  const order = await newOrder(f.manager, f, [f.oil]);
  await api("PATCH", `/api/orders/${order.order_id}/approval`, f.manager, { decision: "approve", method: "phone" });
  await api("PATCH", `/api/order-lines/${order.lines[0].line_id}/technician`, f.manager, { technician_id: f.techId });
  const other = await api("PATCH", `/api/order-lines/${order.lines[0].line_id}/status`, f.tech2, { status: 1 });
  assert.equal(other.code, 403);
  const mine = await api("PATCH", `/api/order-lines/${order.lines[0].line_id}/status`, f.tech, { status: 1 });
  assert.equal(mine.code, 200);
});

test("wrong passwords are limited: the 6th try for one email gets 429", async () => {
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await api("POST", "/api/auth/login", null, { email: "nobody@test.local", password: "Wrong12345" })).code);
  assert.deepEqual(codes, [401, 401, 401, 401, 401, 429]);
});

test("setup locks itself once installed", async () => {
  const r = await api("POST", "/api/install", null, undefined, { "x-setup-key": process.env.INSTALL_SECRET });
  assert.equal(r.code, 403);
  assert.match(r.message, /already installed/);
});
