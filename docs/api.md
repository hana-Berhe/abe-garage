# API

Addresses and methods follow the team's backend task list (BE-001 to BE-050). Each row names its task.

Every answer is JSON shaped `{ status, message, data }`. Staff endpoints need the `x-access-token` header from login.
Roles: **T** Technician, **M** Manager, **A** Admin. Lists take `?page=&search=` and return 10 rows plus a total.

`PATCH` edits change only the fields you send; fields left out keep their saved value. Send at least one editable field,
plus the `updated_at` you loaded so a stale edit is refused with 409.

Errors: 400 wrong input (with `data.field`), 401 not logged in, expired or signed out, 403 wrong role or account switched off, 404 not found, 409 duplicate, stale edit or already paid, 429 too many login attempts (with `Retry-After`), 500 server error.

The account is checked on every request. A role change, a switch-off or a new password signs that person out everywhere at once.

| Method | Endpoint | Purpose | Roles | Task |
| --- | --- | --- | --- | --- |
| POST | `/api/install` | Create tables, roles, settings and the first admin (locked after setup) | Setup | BE-047 |
| GET | `/api/health` | API is running | Public | BE-048 |
| POST | `/api/auth/login` | Log in. 5 wrong passwords for one email (or 30 tries from one address) in 15 minutes gives 429 | Public | BE-004 |
| PATCH | `/api/auth/password` | Change own password (`old_password`, `new_password`); signs out every session | T, M, A | BE-007 |
| POST | `/api/employees` | Add staff | A | BE-009 |
| GET | `/api/employees` | List staff (`?role=&active=`); managers get active technicians only | M, A | BE-010 |
| GET | `/api/employees/:employee_id` | View staff | A | BE-011 |
| PATCH | `/api/employees/:employee_id` | Edit or switch off staff; 409 if it would leave no active admin | A | BE-012 |
| GET | `/api/settings` | Garage details, VAT rate, opening and closing time | A | BE-014 |
| PATCH | `/api/settings` | Change garage settings | A | BE-015 |
| GET | `/api/public/garage` | Garage name, contact details and hours | Public | extra |
| POST | `/api/customers` | Add a customer (optionally with their first car) | M, A | BE-016 |
| GET | `/api/customers` | List or search by name, phone, email or plate | T, M, A | BE-017 |
| GET | `/api/customers/:customer_id` | Profile with cars, orders and money owed | T, M, A | BE-018 |
| PATCH | `/api/customers/:customer_id` | Edit or switch off a customer | M, A | BE-019 |
| POST | `/api/vehicles` | Add a car | M, A | BE-020 |
| GET | `/api/customers/:customer_id/vehicles` | Cars of a customer | T, M, A | BE-021 |
| GET | `/api/vehicles/:vehicle_id` | Car with service history | T, M, A | BE-022, BE-024 |
| PATCH | `/api/vehicles/:vehicle_id` | Edit a car | M, A | BE-023 |
| POST | `/api/services` | Add a service | A | BE-025 |
| GET | `/api/services` | All services, including inactive | T, M, A | BE-026 |
| PATCH | `/api/services/:service_id` | Edit or deactivate a service | A | BE-027 |
| GET | `/api/public/services` | Active services, without prices (prices are for signed-in staff only) | Public | BE-028 |
| POST | `/api/orders` | Create an order (Awaiting approval) and email the status link | M, A | BE-029 |
| GET | `/api/orders` | List (`?status=&paid=&search=`) | T, M, A | BE-030 |
| GET | `/api/orders/:order_id` | Order detail | T, M, A | BE-031 |
| PATCH | `/api/orders/:order_id` | Edit notes and date, and jobs while Awaiting approval (an empty `lines` removes every unstarted job when started jobs remain) | M, A | BE-032 |
| PATCH | `/api/orders/:order_id/approval` | Record approve or decline (`decision`, `method`); approval sets Approved, In progress or Completed from the jobs | M, A | BE-033 |
| POST | `/api/orders/:order_id/lines` | Add extra work; the order goes back to Awaiting approval | M, A | BE-034 |
| PATCH | `/api/order-lines/:line_id/technician` | Assign a technician | M, A | BE-035 |
| GET | `/api/my-jobs` | Jobs of the logged-in technician | T | BE-036 |
| PATCH | `/api/order-lines/:line_id/status` | Start (1) or finish (2) a job, or save a work note | own T, M, A | BE-037, BE-038 |
| POST | `/api/orders/:order_id/invoice` | Issue the invoice once and store a frozen copy (completed orders whose total matches the last approval); 201 first time, 200 after | M, A | BE-040 |
| GET | `/api/orders/:order_id/invoice` | The stored invoice plus payment details; 404 before it is issued | M, A | BE-041 |
| PATCH | `/api/orders/:order_id/payment` | Mark paid in cash (once, after the invoice is issued) | M, A | BE-042 |
| GET | `/api/public/orders/:order_hash` | Customer status page data (safe fields only, no prices) | Public | BE-044 |
| POST | `/api/orders/:order_id/resend-email` | Send the status link or "car is ready" email again | M, A | BE-045 |
| GET | `/api/dashboard` | Counters, cash totals and the orders that need attention | M, A | BE-046 |

Not built yet: BE-005 and BE-006 (forgot and reset password), BE-008 (`GET /api/profile`), BE-013 (`GET /api/roles`)
and BE-039 (`GET /api/orders/:order_id/estimate`).
