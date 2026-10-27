-- For databases created before login tokens could be withdrawn. Run once.
-- token_version is raised on a role change, switch-off or new password; older login tokens then stop working.
ALTER TABLE employees ADD COLUMN token_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER active;
