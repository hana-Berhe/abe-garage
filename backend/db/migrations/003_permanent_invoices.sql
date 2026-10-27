-- For databases created before invoices were stored. Run once.
-- An invoice is issued once and keeps a frozen copy of what it shows (BE-040).
-- Orders that were already paid have no stored invoice yet: open the invoice page and press "Issue invoice"
-- to store one (it records what the order shows at that moment).
ALTER TABLE orders
  ADD COLUMN invoice_number    VARCHAR(20)  NULL AFTER paid_received_by,
  ADD COLUMN invoice_issued_at DATETIME     NULL AFTER invoice_number,
  ADD COLUMN invoice_issued_by INT UNSIGNED NULL AFTER invoice_issued_at,
  ADD COLUMN invoice_snapshot  JSON         NULL AFTER invoice_issued_by,
  ADD UNIQUE KEY uq_orders_invoice (invoice_number),
  ADD CONSTRAINT fk_orders_invoice_by FOREIGN KEY (invoice_issued_by) REFERENCES employees (employee_id),
  ADD CONSTRAINT ck_orders_invoice CHECK (invoice_number IS NULL OR status = 4);
