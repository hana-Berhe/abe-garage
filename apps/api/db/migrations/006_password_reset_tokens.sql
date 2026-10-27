-- BE-005/006: "Forgot password?" links. Safe to run more than once.
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
