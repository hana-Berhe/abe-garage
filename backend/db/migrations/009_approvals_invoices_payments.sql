-- Moves approvals, invoices and payments out of orders into their own tables (order_approvals, invoices,
-- cash_payments). Copies the existing data first, then drops the old order columns. Run once.

-- FR-EST-02..06: every yes or no the customer gave, how they gave it, and the total they answered.
-- An order can be approved more than once (extra work found during repair), so this is its own table.
CREATE TABLE IF NOT EXISTS order_approvals (
  approval_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id        INT UNSIGNED NOT NULL,
  recorded_by     INT UNSIGNED NOT NULL,
  decision        ENUM('approved','declined') NOT NULL,
  approval_method ENUM('in_person','phone')   NOT NULL,
  order_total     DECIMAL(10,2) NOT NULL,
  note            VARCHAR(255)  NULL,
  decided_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (approval_id),
  KEY ix_order_approvals_order (order_id, decision, approval_id),
  CONSTRAINT fk_order_approvals_order FOREIGN KEY (order_id) REFERENCES orders (order_id),
  CONSTRAINT fk_order_approvals_by FOREIGN KEY (recorded_by) REFERENCES employees (employee_id),
  CONSTRAINT ck_order_approvals_total CHECK (order_total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BE-040: one invoice per completed order. It keeps the garage, customer and car details as they were when it
-- was issued, so later edits never change it. Jobs, prices and totals are read from the order: they can't change
-- once the order is completed, and an invoice is only issued for a completed order.
CREATE TABLE IF NOT EXISTS invoices (
  invoice_id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id            INT UNSIGNED NOT NULL,
  invoice_number      VARCHAR(20)  NOT NULL,
  issued_by           INT UNSIGNED NOT NULL,
  issued_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  garage_name         VARCHAR(100) NOT NULL,
  garage_address      VARCHAR(255) NULL,
  garage_phone        VARCHAR(30)  NULL,
  garage_email        VARCHAR(255) NULL,
  customer_first_name VARCHAR(100) NOT NULL,
  customer_last_name  VARCHAR(100) NOT NULL,
  customer_email      VARCHAR(255) NOT NULL,
  customer_phone      VARCHAR(30)  NOT NULL,
  vehicle_year        SMALLINT UNSIGNED NULL,
  vehicle_make        VARCHAR(50)  NOT NULL,
  vehicle_model       VARCHAR(50)  NOT NULL,
  vehicle_type        VARCHAR(30)  NULL,
  vehicle_mileage     INT UNSIGNED NULL,
  vehicle_plate       VARCHAR(20)  NOT NULL,
  vehicle_vin         VARCHAR(32)  NULL,
  vehicle_color       VARCHAR(30)  NULL,
  notes_for_customer  TEXT         NULL,
  PRIMARY KEY (invoice_id),
  UNIQUE KEY uq_invoices_order (order_id),
  UNIQUE KEY uq_invoices_number (invoice_number),
  CONSTRAINT fk_invoices_order FOREIGN KEY (order_id) REFERENCES orders (order_id),
  CONSTRAINT fk_invoices_issued_by FOREIGN KEY (issued_by) REFERENCES employees (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- FR-INV-02, BE-042: the cash payment for an invoice, paid in full. An order is paid when this row exists.
CREATE TABLE IF NOT EXISTS cash_payments (
  invoice_id  INT UNSIGNED NOT NULL,
  received_by INT UNSIGNED NOT NULL,
  paid_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (invoice_id),
  KEY ix_cash_payments_paid_at (paid_at),
  CONSTRAINT fk_cash_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (invoice_id),
  CONSTRAINT fk_cash_payments_by FOREIGN KEY (received_by) REFERENCES employees (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Approvals: one row per "approved" or "declined" line in the order history, which has the method and the total.
INSERT INTO order_approvals (order_id, recorded_by, decision, approval_method, order_total, decided_at)
SELECT h.order_id, COALESCE(h.employee_id, o.created_by), h.action,
       IF(h.details LIKE 'by phone%', 'phone', 'in_person'),
       COALESCE(CAST(SUBSTRING(REGEXP_SUBSTR(h.details, 'total [0-9]+[.][0-9]{2}'), 7) AS DECIMAL(10,2)), o.total),
       h.created_at
FROM order_history h JOIN orders o ON o.order_id = h.order_id
WHERE h.action IN ('approved', 'declined')
ORDER BY h.created_at, h.history_id;

-- Issued invoices: the header details come from the frozen JSON copy.
INSERT INTO invoices (order_id, invoice_number, issued_by, issued_at, garage_name, garage_address, garage_phone, garage_email,
  customer_first_name, customer_last_name, customer_email, customer_phone, vehicle_year, vehicle_make, vehicle_model,
  vehicle_type, vehicle_mileage, vehicle_plate, vehicle_vin, vehicle_color, notes_for_customer)
SELECT o.order_id, o.invoice_number, COALESCE(o.invoice_issued_by, o.created_by), COALESCE(o.invoice_issued_at, o.completed_at, o.created_at),
  JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.garage.name')),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.garage.address')), 'null'),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.garage.phone')), 'null'),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.garage.email')), 'null'),
  JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.first_name')),
  JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.last_name')),
  JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.email')),
  JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.phone')),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.year')), 'null'),
  JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.make')),
  JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.model')),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.type')), 'null'),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.mileage')), 'null'),
  JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.plate')),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.vin')), 'null'),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.color')), 'null'),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(o.invoice_snapshot, '$.notes_for_customer')), 'null')
FROM orders o
WHERE o.invoice_number IS NOT NULL AND o.invoice_snapshot IS NOT NULL;

-- Orders paid before invoices were stored get an invoice now, from today's details, dated when they were paid.
INSERT INTO invoices (order_id, invoice_number, issued_by, issued_at, garage_name, garage_address, garage_phone, garage_email,
  customer_first_name, customer_last_name, customer_email, customer_phone, vehicle_year, vehicle_make, vehicle_model,
  vehicle_type, vehicle_mileage, vehicle_plate, vehicle_vin, vehicle_color, notes_for_customer)
SELECT o.order_id, COALESCE(o.invoice_number, CONCAT('INV-', LPAD(o.order_id, 6, '0'))),
  COALESCE(o.invoice_issued_by, o.paid_received_by, o.created_by), COALESCE(o.invoice_issued_at, o.paid_at, o.completed_at, o.created_at),
  g.name, g.address, g.phone, g.email, c.first_name, c.last_name, c.email, c.phone,
  v.year, v.make, v.model, v.type, v.mileage, v.plate, v.vin, v.color, o.notes_for_customer
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
JOIN vehicles v ON v.vehicle_id = o.vehicle_id
JOIN garage_settings g ON g.settings_id = 1
WHERE (o.paid = 1 OR o.invoice_number IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.order_id = o.order_id);

INSERT INTO cash_payments (invoice_id, received_by, paid_at)
SELECT i.invoice_id, COALESCE(o.paid_received_by, i.issued_by), COALESCE(o.paid_at, i.issued_at)
FROM orders o JOIN invoices i ON i.order_id = o.order_id
WHERE o.paid = 1;

ALTER TABLE orders
  DROP CHECK ck_orders_paid,
  DROP CHECK ck_orders_invoice,
  DROP FOREIGN KEY fk_orders_approved_by,
  DROP FOREIGN KEY fk_orders_paid_by,
  DROP FOREIGN KEY fk_orders_invoice_by;

ALTER TABLE orders
  DROP INDEX uq_orders_invoice,
  DROP INDEX ix_orders_status_paid,
  DROP INDEX ix_orders_paid_at,
  DROP COLUMN approved_by,
  DROP COLUMN approved_at,
  DROP COLUMN approval_method,
  DROP COLUMN paid,
  DROP COLUMN paid_at,
  DROP COLUMN paid_received_by,
  DROP COLUMN invoice_number,
  DROP COLUMN invoice_issued_at,
  DROP COLUMN invoice_issued_by,
  DROP COLUMN invoice_snapshot;
