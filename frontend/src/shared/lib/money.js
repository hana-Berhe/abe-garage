// Browser preview only. The server recalculates with backend/utils/money.js and its numbers are the ones saved.
const cents = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
};

export function previewTotals(prices, vatRate) {
  const sub = prices.reduce((s, p) => s + cents(p), 0);
  const vat = Math.round((sub * Number(vatRate)) / 100);
  return { subtotal: (sub / 100).toFixed(2), vat_amount: (vat / 100).toFixed(2), total: ((sub + vat) / 100).toFixed(2) };
}
