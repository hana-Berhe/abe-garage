# Database

MySQL 8, InnoDB, utf8mb4. The whole schema is in [`apps/api/db/schema.sql`](../apps/api/db/schema.sql) and is safe to run twice.

## Tables

| Table | Holds |
| --- | --- |
| `roles` | 1 Technician, 2 Manager, 3 Admin |
| `employees` | staff accounts (bcrypt password hash, role, active flag, and a `token_version` that goes up to sign the person out everywhere) |
| `password_reset_tokens` | "Forgot password" links: the SHA-256 of the token (never the token), who it is for, when it expires (15 minutes) and when it was used |
| `customers` | car owners; email and phone are unique |
| `vehicles` | cars; the plate is unique, the VIN is optional (up to 32 characters, not unique); each belongs to one customer |
| `services` | the price list (price before VAT, labor hours, active flag) |
| `orders` | one visit of one car: status 1 to 5, paid flag, copied VAT rate and money totals, order hash, and once issued the invoice number, who issued it and when, and a frozen copy of the invoice (`invoice_snapshot`) |
| `order_lines` | the jobs in an order, with a copied price, one technician and a status (0 Not started, 1 Started, 2 Done) |
| `order_history` | who did what and when (created, approved, job_started, paid, email_sent, …) |
| `garage_settings` | the single row of garage details and the VAT rate (15%) |

## Rules the database enforces

- Unique: staff email, customer email and phone, car plate, service name, order hash, invoice number.
- An order's `(vehicle_id, customer_id)` must match a car of that customer.
- `status` 1 to 5, `line_status` 0 to 2, prices of 0 or more.
- `paid` can only be 1 when `status` is 4 (Completed).
- An invoice number can only be set when `status` is 4 (Completed).
- Only one `garage_settings` row.
- No cascading deletes.
- `updated_at` keeps milliseconds so stale edits are always caught.

## Setting it up

```bash
mysql -u root -p -e "CREATE DATABASE abe_garage CHARACTER SET utf8mb4;
  CREATE USER 'abe'@'localhost' IDENTIFIED BY 'change_me';
  GRANT ALL ON abe_garage.* TO 'abe'@'localhost';"
cp apps/api/.env.example apps/api/.env      # fill in DB_* and INSTALL_ADMIN_*
npm run dev:api
curl -X POST -H "X-Setup-Key: <INSTALL_SECRET>" http://localhost:8000/api/install  # once: tables, roles, settings, first admin
npm run seed                                  # optional demo data
```

An existing database gets newer changes with one command. It applies each file in `apps/api/db/migrations` once, in order, and records it in the `schema_migrations` table, so running it again does nothing:

```bash
npm --prefix apps/api run migrate
```

A fresh install records every file as done, because `schema.sql` already has them all. If you ran some files by hand before this command existed, say which was the last one, and the command records those as done and applies only the rest (for example, when you last ran `006`):

```bash
npm --prefix apps/api run migrate -- --already=006
```

After `003`, orders that were already paid have no saved invoice. A manager can issue it from the order's invoice page.

`004` removes the old `callback_requests` table from the website call-back form, which no longer exists. It deletes any saved requests, so back them up first if you want to keep them (the file shows how). A database that never had the table can skip it.

`007` copies each job's name, description and hours onto the order, taken from the service list as it is when you run it. From then on, renaming a service doesn't change existing orders.

`POST /api/install` locks itself once any staff account exists (it then answers 403). It only works while `INSTALL_ENABLED=true` and with the `X-Setup-Key` header set to `INSTALL_SECRET` (16 characters or more). Set `INSTALL_ENABLED=false` on a live server once setup is done.
