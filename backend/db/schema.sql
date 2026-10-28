-- Abe Garage schema: 13 tables, MySQL 8 (InnoDB, utf8mb4).
-- Owned by Member 1. Safe to run twice (IF NOT EXISTS, INSERT IGNORE).
-- Rows are deactivated, never deleted, so no foreign key cascades.
-- updated_at keeps milliseconds so two quick saves never share a value (NFR-16).

CREATE TABLE IF NOT EXISTS roles (
  role_id   TINYINT UNSIGNED NOT NULL,
  role_name VARCHAR(30)      NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id),
  UNIQUE KEY uq_roles_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS employees (
  employee_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(30)  NULL,
  password_hash CHAR(60)     NOT NULL,
  role_id       TINYINT UNSIGNED NOT NULL,
  active        TINYINT(1)   NOT NULL DEFAULT 1,
  -- Raised on a role change, switch-off or new password; older login tokens then stop working.
  token_version INT UNSIGNED NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (employee_id),
  UNIQUE KEY uq_employees_email (email),
  KEY ix_employees_role_active (role_id, active),
  CONSTRAINT fk_employees_role FOREIGN KEY (role_id) REFERENCES roles (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BE-005/006: one-time "forgot password" links. Only the SHA-256 of the token is stored; it lasts 15 minutes.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id INT UNSIGNED NOT NULL,
  token_hash  CHAR(64) NOT NULL,
  expires_at  DATETIME NOT NULL,
  used_at     DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_id),
  UNIQUE KEY uq_reset_token_hash (token_hash),
  KEY ix_reset_employee (employee_id, used_at),
  CONSTRAINT fk_reset_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS customers (
  customer_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(30)  NOT NULL,
  active      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (customer_id),
  UNIQUE KEY uq_customers_email (email),
  UNIQUE KEY uq_customers_phone (phone),
  KEY ix_customers_name (last_name, first_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vehicles (
  vehicle_id  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id INT UNSIGNED NOT NULL,
  year        SMALLINT UNSIGNED NULL,
  make        VARCHAR(50)  NOT NULL,
  model       VARCHAR(50)  NOT NULL,
  type        VARCHAR(30)  NULL,
  mileage     INT UNSIGNED NULL,
  plate       VARCHAR(20)  NOT NULL,
  vin         VARCHAR(32)  NULL,
  color       VARCHAR(30)  NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (vehicle_id),
  UNIQUE KEY uq_vehicles_plate (plate),
  -- Lets orders point at (vehicle_id, customer_id) so a car must belong to the order's customer.
  UNIQUE KEY uq_vehicles_owner (vehicle_id, customer_id),
  KEY ix_vehicles_customer (customer_id),
  KEY ix_vehicles_vin (vin),
  CONSTRAINT fk_vehicles_customer FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS services (
  service_id  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)  NOT NULL,
  description TEXT          NULL,
  price       DECIMAL(10,2) NOT NULL,
  labor_hours DECIMAL(4,2)  NOT NULL DEFAULT 0,
  active      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (service_id),
  UNIQUE KEY uq_services_name (name),
  CONSTRAINT ck_services_price CHECK (price >= 0),
  CONSTRAINT ck_services_hours CHECK (labor_hours >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  order_id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id          INT UNSIGNED NOT NULL,
  vehicle_id           INT UNSIGNED NOT NULL,
  created_by           INT UNSIGNED NOT NULL,
  status               TINYINT UNSIGNED NOT NULL DEFAULT 1,
  order_hash           CHAR(32)     NOT NULL,
  estimated_ready_date DATE         NULL,
  completed_at         DATETIME     NULL,
  notes_for_customer   TEXT         NULL,
  internal_notes       TEXT         NULL,
  subtotal             DECIMAL(10,2) NOT NULL DEFAULT 0,
  vat_rate             DECIMAL(5,2)  NOT NULL,
  vat_amount           DECIMAL(10,2) NOT NULL DEFAULT 0,
  total                DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (order_id),
  UNIQUE KEY uq_orders_hash (order_hash),
  KEY ix_orders_status_created (status, created_at),
  KEY ix_orders_customer (customer_id),
  KEY ix_orders_vehicle_owner (vehicle_id, customer_id),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
  CONSTRAINT fk_orders_vehicle_owner FOREIGN KEY (vehicle_id, customer_id) REFERENCES vehicles (vehicle_id, customer_id),
  CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by) REFERENCES employees (employee_id),
  CONSTRAINT ck_orders_status CHECK (status BETWEEN 1 AND 5),
  CONSTRAINT ck_orders_money CHECK (subtotal >= 0 AND vat_amount >= 0 AND total >= 0 AND vat_rate >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_lines (
  line_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id        INT UNSIGNED NOT NULL,
  service_id      INT UNSIGNED NULL,
  description     VARCHAR(255) NULL,
  -- A copy of the job taken when it was added, so renaming or editing a service never changes this order (BE-029).
  service_name        VARCHAR(255) NOT NULL,
  service_description TEXT         NULL,
  labor_hours         DECIMAL(4,2) NULL,
  line_price      DECIMAL(10,2) NOT NULL,
  technician_id   INT UNSIGNED NULL,
  line_status     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  started_at      DATETIME NULL,
  done_at         DATETIME NULL,
  technician_note TEXT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (line_id),
  UNIQUE KEY uq_order_lines_service (order_id, service_id),
  KEY ix_order_lines_tech (technician_id, line_status),
  CONSTRAINT fk_order_lines_order FOREIGN KEY (order_id) REFERENCES orders (order_id),
  CONSTRAINT fk_order_lines_service FOREIGN KEY (service_id) REFERENCES services (service_id),
  CONSTRAINT fk_order_lines_tech FOREIGN KEY (technician_id) REFERENCES employees (employee_id),
  CONSTRAINT ck_order_lines_status CHECK (line_status BETWEEN 0 AND 2),
  CONSTRAINT ck_order_lines_price CHECK (line_price >= 0),
  -- A line is either a service from the list or an extra item with its own description.
  CONSTRAINT ck_order_lines_kind CHECK (service_id IS NOT NULL OR description IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

CREATE TABLE IF NOT EXISTS order_history (
  history_id  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id    INT UNSIGNED NOT NULL,
  employee_id INT UNSIGNED NULL,
  action      VARCHAR(40)  NOT NULL,
  details     VARCHAR(255) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (history_id),
  KEY ix_order_history_order (order_id, created_at),
  CONSTRAINT fk_order_history_order FOREIGN KEY (order_id) REFERENCES orders (order_id),
  CONSTRAINT fk_order_history_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS garage_settings (
  settings_id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  name        VARCHAR(100) NOT NULL,
  address     VARCHAR(255) NULL,
  phone       VARCHAR(30)  NULL,
  email       VARCHAR(255) NULL,
  vat_rate    DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  opening_time TIME NOT NULL DEFAULT '08:00:00',
  closing_time TIME NULL,
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (settings_id),
  CONSTRAINT ck_settings_single_row CHECK (settings_id = 1),
  CONSTRAINT ck_settings_vat CHECK (vat_rate >= 0 AND vat_rate <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO roles (role_id, role_name) VALUES
  (1, 'Technician'),
  (2, 'Manager'),
  (3, 'Admin');

INSERT IGNORE INTO garage_settings (settings_id, name, address, phone, email, vat_rate, opening_time) VALUES
  (1, 'Abe Garage', 'Addis Ababa', '+251 000 000 000', 'info@abegarage.example', 15.00, '08:00:00');
