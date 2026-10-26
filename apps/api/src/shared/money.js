// The only place money is calculated (section 5 of the PRD).
// Works in whole cents so 0.1 + 0.2 problems never reach a bill.

function toCents(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Not a money value: ${value}`);
  return Math.round(n * 100);
}

function fromCents(cents) {
  return (cents / 100).toFixed(2);
}

// prices: list of line prices before VAT; vatRate: percent, e.g. 15 or "15.00".
function calculateTotals(prices, vatRate) {
  const subtotalCents = prices.reduce((sum, p) => sum + toCents(p), 0);
  const vatCents = Math.round((subtotalCents * Number(vatRate)) / 100);
  return {
    subtotal: fromCents(subtotalCents),
    vat_rate: Number(vatRate).toFixed(2),
    vat_amount: fromCents(vatCents),
    total: fromCents(subtotalCents + vatCents),
  };
}

module.exports = { calculateTotals, toCents, fromCents };
