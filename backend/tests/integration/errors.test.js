// BE-049 (8): every error comes back in the same { status, message, data } shape.
import { test } from "node:test";
import assert from "node:assert/strict";
import { useApp, api, ctx } from "./helpers.js";

const f = useApp();

const shape = (r) => {
  assert.equal(r.status, "error");
  assert.equal(typeof r.message, "string");
  assert.ok("data" in r);
};

test("malformed JSON gets 400", async () => {
  const r = await api("POST", "/api/auth/login", null, '{"email": "a@b.com", ');
  assert.equal(r.code, 400);
  shape(r);
});

test("an unknown address gets 404", async () => {
  const r = await api("GET", "/api/does-not-exist");
  assert.equal(r.code, 404);
  shape(r);
});

test("a database error gets 500 without leaking details", async () => {
  const original = ctx.pool.query.bind(ctx.pool);
  ctx.pool.query = async (q, ...rest) => {
    if (String(q).includes("FROM garage_settings")) throw Object.assign(new Error("connection lost to db-host-42"), { code: "PROTOCOL_CONNECTION_LOST" });
    return original(q, ...rest);
  };
  const quiet = console.error;
  console.error = () => {};
  try {
    const r = await api("GET", "/api/public/garage");
    assert.equal(r.code, 500);
    shape(r);
    assert.ok(!JSON.stringify(r).includes("db-host-42"));
    assert.ok(!JSON.stringify(r).includes("stack"));
  } finally {
    ctx.pool.query = original;
    console.error = quiet;
  }
});

test("an error thrown inside an async handler is caught and shaped", async () => {
  const r = await api("GET", "/api/orders/999999", f.manager);
  assert.equal(r.code, 404);
  shape(r);
});

test("health check answers ready", async () => {
  const r = await api("GET", "/api/health");
  assert.equal(r.code, 200);
  assert.equal(r.status, "success");
  assert.deepEqual(r.data, { service: "abe-garage-api", ready: true });
});
