# Database

MySQL 8, InnoDB, utf8mb4. The whole schema is in [`apps/api/db/schema.sql`](../apps/api/db/schema.sql) and is safe to run twice.

## Tables

| Table | Holds |
| --- | --- |
| `roles` | 1 Technician, 2 Manager, 3 Admin |
| `employees` | staff accounts (bcrypt password hash, role, active flag, and a `token_version` that goes up to sign the person out everywhere) |
| `customers` | car owners; email and phone are unique |
| `vehicles` | cars; plate and VIN are unique; each belongs to one customer |
| `services` | the price list (price before VAT, labor hours, active flag) |
| `orders` | one visit of one car: status 1 to 5, paid flag, copied VAT rate and money totals, order hash, and once issued the invoice number, who issued it and when, and a frozen copy of the invoice (`invoice_snapshot`) |
| `order_lines` | the jobs in an order, with a copied price, one technician and a status (0 Not started, 1 Started, 2 Done) |
| `order_history` | who did what and when (created, approved, job_started, paid, email_sent, …) |
| `garage_settings` | the single row of garage details and the VAT rate (15%) |
| `callback_requests` | "Request a call back" forms from the website: name, phone, car, service (empty means "Not sure"), problem, best time to call, and status 0 New or 1 Called (with who called and when) |

## Rules the database enforces

- Unique: staff email, customer email and phone, car plate and VIN, service name, order hash, invoice number.
- An order's `(vehicle_id, customer_id)` must match a car of that customer.
- `status` 1 to 5, `line_status` 0 to 2, prices of 0 or more.
- `paid` can only be 1 when `status` is 4 (Completed).
- An invoice number can only be set when `status` is 4 (Completed).
- Only one `garage_settings` row.
- A call-back `status` is 0 or 1, and `best_time` is `any`, `morning` or `afternoon`.
- No cascading deletes.
- `updated_at` keeps milliseconds so stale edits are always caught.

## Setting it up

```bash
mysql -u root -p -e "CREATE DATABASE abe_garage CHARACTER SET utf8mb4;
  CREATE USER 'abe'@'localhost' IDENTIFIED BY 'change_me';
  GRANT ALL ON abe_garage.* TO 'abe'@'localhost';"
cp apps/api/.env.example apps/api/.env      # fill in DB_* and INSTALL_ADMIN_*
npm run dev:api
curl -X POST http://localhost:8000/api/install  # once: tables, roles, settings, first admin
npm run seed                                  # optional demo data
```

An existing database needs each newer change once, in order (skip any it already has):

```bash
mysql -u abe -p abe_garage < apps/api/db/migrations/001_callback_requests.sql
mysql -u abe -p abe_garage < apps/api/db/migrations/002_employee_token_version.sql
mysql -u abe -p abe_garage < apps/api/db/migrations/003_permanent_invoices.sql
```

After `003`, orders that were already paid have no saved invoice. A manager can issue it from the order's invoice page.

`POST /api/install` locks itself once any staff account exists (it then answers 403).
