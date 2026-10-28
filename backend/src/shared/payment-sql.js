// An order is paid when its invoice has a cash payment (FR-INV-02). These read that state for an order aliased `o`.
const PAID = `EXISTS (SELECT 1 FROM invoices pi JOIN cash_payments pc ON pc.invoice_id = pi.invoice_id WHERE pi.order_id = o.order_id)`;

// Adds the order's invoice (i) and payment (cp). Each order has at most one of each, so no rows are repeated.
const PAYMENT_JOIN = `LEFT JOIN invoices i ON i.order_id = o.order_id LEFT JOIN cash_payments cp ON cp.invoice_id = i.invoice_id`;

export { PAID, PAYMENT_JOIN };
