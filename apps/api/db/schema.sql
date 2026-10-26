-- Abe Garage schema: 9 tables, MySQL 8 (InnoDB, utf8mb4).
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
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (employee_id),
  UNIQUE KEY uq_employees_email (email),
  KEY ix_employees_role_active (role_id, active),
  CONSTRAINT fk_employees_role FOREIGN KEY (role_id) REFERENCES roles (role_id)
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
  vin         VARCHAR(17)  NULL,
  color       VARCHAR(30)  NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (vehicle_id),
  UNIQUE KEY uq_vehicles_plate (plate),
  UNIQUE KEY uq_vehicles_vin (vin),
  -- Lets orders point at (vehicle_id, customer_id) so a car must belong to the order's customer.
  UNIQUE KEY uq_vehicles_owner (vehicle_id, customer_id),
  KEY ix_vehicles_customer (customer_id),
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
  approved_by          INT UNSIGNED NULL,
  approved_at          DATETIME     NULL,
  approval_method      ENUM('in_person','phone') NULL,
  subtotal             DECIMAL(10,2) NOT NULL DEFAULT 0,
  vat_rate             DECIMAL(5,2)  NOT NULL,
  vat_amount           DECIMAL(10,2) NOT NULL DEFAULT 0,
  total                DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid                 TINYINT(1)    NOT NULL DEFAULT 0,
  paid_at              DATETIME      NULL,
  paid_received_by     INT UNSIGNED  NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (order_id),
  UNIQUE KEY uq_orders_hash (order_hash),
  KEY ix_orders_status_paid (status, paid),
  KEY ix_orders_customer (customer_id),
  KEY ix_orders_vehicle_owner (vehicle_id, customer_id),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
  CONSTRAINT fk_orders_vehicle_owner FOREIGN KEY (vehicle_id, customer_id) REFERENCES vehicles (vehicle_id, customer_id),
  CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by) REFERENCES employees (employee_id),
  CONSTRAINT fk_orders_approved_by FOREIGN KEY (approved_by) REFERENCES employees (employee_id),
  CONSTRAINT fk_orders_paid_by FOREIGN KEY (paid_received_by) REFERENCES employees (employee_id),
  CONSTRAINT ck_orders_status CHECK (status BETWEEN 1 AND 5),
  CONSTRAINT ck_orders_money CHECK (subtotal >= 0 AND vat_amount >= 0 AND total >= 0 AND vat_rate >= 0),
  CONSTRAINT ck_orders_paid CHECK (paid = 0 OR status = 4)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_lines (
  line_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id        INT UNSIGNED NOT NULL,
  service_id      INT UNSIGNED NULL,
  description     VARCHAR(255) NULL,
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
