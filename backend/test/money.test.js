const test = require("node:test");
const assert = require("node:assert");
const { calculateTotals } = require("../utils/money");

test("AT-02: Oil change + Brakes gives 230.00 + 34.50 = 264.50", () => {
  assert.deepStrictEqual(calculateTotals(["50.00", "180.00"], "15.00"), {
    subtotal: "230.00",
    vat_rate: "15.00",
    vat_amount: "34.50",
    total: "264.50",
  });
});

test("VAT rounds to 2 decimals", () => {
  assert.strictEqual(calculateTotals(["0.10", "0.20"], 15).vat_amount, "0.05");
  assert.strictEqual(calculateTotals(["33.33"], 15).total, "38.33");
});

test("an empty order is all zero", () => {
  assert.strictEqual(calculateTotals([], 15).total, "0.00");
});
