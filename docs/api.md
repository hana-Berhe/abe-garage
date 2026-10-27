# API

Addresses and methods follow the team's backend task list (BE-001 to BE-050). Each row names its task.

Every answer is JSON shaped `{ status, message, data }`, with `status` either `success` or `error`. Staff endpoints need the header `Authorization: Bearer <access_token>` from login (the older `x-access-token: <access_token>` header still works).
Roles: **T** Technician, **M** Manager, **A** Admin. Lists take `?page=&search=` and return 10 rows plus a total.

`PATCH` edits change only the fields you send; fields left out keep their saved value. Send at least one editable field,
plus the `updated_at` you loaded so a stale edit is refused with 409.

Each address accepts only the fields it reads; any other field is refused with 400 and named in the answer. Bodies over 256 KB get 413. Prices have at most two decimals.

Errors: 400 wrong input (`message: "Validation failed"`, `data: { errors: { <field>: <message> } }`), 401 not logged in, expired or signed out, 403 wrong role or account switched off, 404 not found, 409 duplicate, stale edit or already paid, 429 too many login or reset attempts (with `Retry-After`), 500 server error.

The account is checked on every request. A role change, a switch-off or a new password signs that person out everywhere at once.

| Method | Endpoint | Purpose | Roles | Task |
| --- | --- | --- | --- | --- |
| POST | `/api/install` | Create tables, roles, settings and the first admin; 201. Needs `INSTALL_ENABLED=true` (else 404) and an `X-Setup-Key` header equal to `INSTALL_SECRET` (else 403). 403 once installed | Setup | BE-047 |
| GET | `/api/health` | 200 `{ service, ready: true }` when the database answers within 2 seconds and setup has run; otherwise 503 `{ ready: false }` | Public | BE-048 |
| POST | `/api/auth/login` | Log in with `{ email, password }`. Answers `{ access_token, token_type: "Bearer", expires_in: 3600, employee }`. The token lasts `JWT_EXPIRES_IN_SECONDS` (1 hour by default) and names `JWT_ISSUER` and `JWT_AUDIENCE`, which are checked on every request. 5 wrong passwords for one email (or 30 tries from one address) in 15 minutes gives 429 | Public | BE-004 |
| POST | `/api/auth/forgot-password` | `{ email }`. Always the same 200 answer; an active account gets an email with a one-time link to `/reset-password?token=…` that lasts 15 minutes. 3 per email and 10 per address in 15 minutes | Public | BE-005 |
| POST | `/api/auth/reset-password` | `{ token, new_password }`. Sets the new password, uses up the link and signs out every session. A missing, used or expired link (or a switched-off account) gives 400. 10 tries per address in 15 minutes | Public | BE-006 |
| GET | `/api/profile` | My own current details from the database (no password hash or token version) | T, M, A | BE-008 |
| PATCH | `/api/auth/password` | Change own password (`old_password`, `new_password`); signs out every session | T, M, A | BE-007 |
| POST | `/api/employees` | Add staff | A | BE-009 |
| GET | `/api/employees` | List staff (`?role=&active=`); managers get active technicians only | M, A | BE-010 |
| GET | `/api/employees/:employee_id` | View staff | A | BE-011 |
| PATCH | `/api/employees/:employee_id` | Edit or switch off staff; 409 if it would leave no active admin. No password here (400): the person uses Forgot password. A new email cancels reset links sent to the old one | A | BE-012 |
| GET | `/api/roles` | The three fixed roles, `{ roles: [{ role_id, role_name }] }`, for the employee form | A | BE-013 |
| GET | `/api/settings` | Garage details, VAT rate, opening and closing time | A | BE-014 |
| PATCH | `/api/settings` | Change garage settings | A | BE-015 |
| GET | `/api/public/garage` | Garage name, contact details and hours | Public | extra |
| POST | `/api/customers` | Add a customer (optionally with their first car) | M, A | BE-016 |
| GET | `/api/customers` | List or search by name, phone, email or plate | T, M, A | BE-017 |
| GET | `/api/customers/:customer_id` | Profile with cars, orders and money owed | T, M, A | BE-018 |
| PATCH | `/api/customers/:customer_id` | Edit or switch off a customer | M, A | BE-019 |
| POST | `/api/vehicles` | Add a car; 404 for a missing customer, 409 for a switched-off one | M, A | BE-020 |
| GET | `/api/customers/:customer_id/vehicles` | Cars of a customer | T, M, A | BE-021 |
| GET | `/api/vehicles/:vehicle_id` | Car with service history | T, M, A | BE-022, BE-024 |
| GET | `/api/vehicles/:vehicle_id/orders` | The car's orders, newest first, 10 a page (`?page=&page_size=`), each with its jobs and saved prices | T, M, A | BE-024 |
| PATCH | `/api/vehicles/:vehicle_id` | Edit a car; 409 if the mileage would go down | M, A | BE-023 |
| POST | `/api/services` | Add a service | A | BE-025 |
| GET | `/api/services` | All services, including inactive | T, M, A | BE-026 |
| PATCH | `/api/services/:service_id` | Edit or deactivate a service | A | BE-027 |
| GET | `/api/public/services` | Active services, without prices (prices are for signed-in staff only) | Public | BE-028 |
| POST | `/api/orders` | Create an order (Awaiting approval) and email the status link. Each job keeps a copy of the service's name, description and hours, so a later rename doesn't change it. The ready date can't be in the past | M, A | BE-029 |
| GET | `/api/orders` | List (`?status=&paid=true|false&customer_id=&vehicle_id=&unpaid_only=true&search=`). `unpaid_only` means completed and not paid; it can't be combined with `paid=true` or another status. Search treats `%` and `_` as plain characters | T, M, A | BE-030 |
| GET | `/api/orders/:order_id` | Order detail. Technicians get it without the customer's email and phone, the internal note and the status link code | T, M, A | BE-031 |
| GET | `/api/orders/:order_id/estimate` | Printable estimate `EST-<order_id>`: garage, customer, car, jobs with their saved prices, totals, customer note. No internal or technician notes, status link code or history. Changes nothing | M, A | BE-039 |
| PATCH | `/api/orders/:order_id` | Edit notes and date, and jobs while Awaiting approval (an empty `lines` removes every unstarted job when started jobs remain; send each job's `line_id` and it keeps its number and technician). Once completed, the ready date can't change (409); notes can | M, A | BE-032 |
| PATCH | `/api/orders/:order_id/approval` | Record approve or decline (`decision`, `method`); approval sets Approved, In progress or Completed from the jobs | M, A | BE-033 |
| POST | `/api/orders/:order_id/lines` | Add extra work; the order goes back to Awaiting approval | M, A | BE-034 |
| PATCH | `/api/order-lines/:line_id/technician` | `{ technician_id }`: assign a job, or move it to another active technician, even once started (it keeps its progress; the history notes old → new). No un-assigning; a done job can't move | M, A | BE-035 |
| GET | `/api/my-jobs` | Jobs of the logged-in technician (no internal notes) | T | BE-036 |
| PATCH | `/api/order-lines/:line_id/status` | Start (1) or finish (2) a job, or save a work note | own T, M, A | BE-037, BE-038 |
| PATCH | `/api/order-lines/:line_id/note` | `{ technician_note }` (up to 2000 characters). Only once the order is approved (409 before, and on a declined order); written to the history | own T, M, A | BE-038 |
| POST | `/api/orders/:order_id/invoice` | Issue the invoice once and store a frozen copy (completed orders whose total matches the last approval); 201 first time, 200 after | M, A | BE-040 |
| GET | `/api/orders/:order_id/invoice` | The stored invoice plus payment details; 404 before it is issued | M, A | BE-041 |
| PATCH | `/api/orders/:order_id/payment` | Mark paid in cash (once, after the invoice is issued). Body `{ "paid": true }` or empty; anything else is 400 | M, A | BE-042 |
| GET | `/api/public/orders/:order_hash` | Customer status page data (safe fields only, no prices). Never cached (`Cache-Control: no-store`, `Referrer-Policy: no-referrer`); 60 lookups per address in 15 minutes | Public | BE-044 |
| POST | `/api/orders/:order_id/resend-email` | Send the status link or "car is ready" email again; 3 per order and 30 in all per person in 15 minutes | M, A | BE-045 |
| GET | `/api/dashboard` | Counters, cash totals and the orders that need attention | M, A | BE-046 |


