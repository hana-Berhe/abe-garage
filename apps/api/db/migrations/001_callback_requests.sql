-- For databases created before call-back requests existed. Safe to run more than once.
-- Call-back requests sent from the public website (there is no online booking).
-- status: 0 new, 1 called.
CREATE TABLE IF NOT EXISTS callback_requests (
  callback_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name   VARCHAR(100) NOT NULL,
  phone       VARCHAR(30)  NOT NULL,
  car         VARCHAR(120) NULL,
  service_id  INT UNSIGNED NULL,
  problem     VARCHAR(1000) NULL,
  best_time   VARCHAR(20)  NOT NULL DEFAULT 'any',
  status      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  called_by   INT UNSIGNED NULL,
  called_at   DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (callback_id),
  KEY ix_callback_status (status, created_at),
  CONSTRAINT fk_callback_service FOREIGN KEY (service_id) REFERENCES services (service_id),
  CONSTRAINT fk_callback_employee FOREIGN KEY (called_by) REFERENCES employees (employee_id),
  CONSTRAINT ck_callback_status CHECK (status IN (0, 1)),
  CONSTRAINT ck_callback_best_time CHECK (best_time IN ('any', 'morning', 'afternoon'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
