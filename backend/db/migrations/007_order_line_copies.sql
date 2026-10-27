-- BE-029: each job keeps a copy of its name, description and labour hours, so renaming or editing a service
-- never changes an existing order. Fills the copy for existing jobs from today's service list. Run once.
ALTER TABLE order_lines
  ADD COLUMN service_name VARCHAR(255) NOT NULL DEFAULT '' AFTER description,
  ADD COLUMN service_description TEXT NULL AFTER service_name,
  ADD COLUMN labor_hours DECIMAL(4,2) NULL AFTER service_description;

UPDATE order_lines l LEFT JOIN services s ON s.service_id = l.service_id
SET l.service_name = COALESCE(s.name, l.description, ''),
    l.service_description = s.description,
    l.labor_hours = s.labor_hours;

ALTER TABLE order_lines ALTER COLUMN service_name DROP DEFAULT;
