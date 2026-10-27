# API

Every answer is JSON shaped `{ status, message, data }`. Staff endpoints need the `x-access-token` header from login.
Roles: **T** Technician, **M** Manager, **A** Admin. Lists take `?page=&search=` and return 10 rows plus a total.

Errors: 400 wrong input (with `data.field`), 401 not logged in or expired, 403 wrong role, 404 not found, 409 duplicate, stale edit or already paid, 500 server error.

| Method | Endpoint | Purpose | Roles |
| --- | --- | --- | --- |
| GET | `/install` | Create tables, roles, settings and the first admin (locked after setup) | Setup |
| POST | `/api/employee/login` | Log in | Public |
| PUT | `/api/employee/password` | Change own password | T, M, A |
| POST | `/api/employee` | Add staff | A |
| GET | `/api/employees` | List staff (`?role=&active=`); managers get active technicians only | M, A |
| GET / PUT | `/api/employee/:id` | View or edit staff | A |
| GET / PUT | `/api/settings` | Garage details, VAT rate, opening and closing time | A |
| GET | `/api/public/garage` | Garage name, contact details and hours | Public |
| POST | `/api/customer` | Add a customer (optionally with their first car) | M, A |
| GET | `/api/customers` | List or search by name, phone, email or plate | T, M, A |
| GET / PUT | `/api/customer/:id` | Profile with cars, orders and money owed / edit | T (view), M, A |
| POST | `/api/vehicle` | Add a car | M, A |
| GET | `/api/customer/:id/vehicles` | Cars of a customer | T, M, A |
| GET / PUT | `/api/vehicle/:id` | Car with service history / edit | T (view), M, A |
| POST | `/api/service` | Add a service | A |
| GET | `/api/services` | All services, including inactive | T, M, A |
| PUT | `/api/service/:id` | Edit or deactivate a service | A |
| GET | `/api/public/services` | Active services, without prices (prices are for signed-in staff only) | Public |
| POST | `/api/order` | Create an order (Awaiting approval) and email the status link | M, A |
| GET | `/api/orders` | List (`?status=&paid=&search=`) | T, M, A |
| GET / PUT | `/api/order/:id` | Order detail / edit notes, date, and jobs while Awaiting approval | T (view), M, A |
| POST | `/api/order/:id/line` | Add extra work; the order goes back to Awaiting approval | M, A |
| PUT | `/api/order/:id/approval` | Record approve or decline (`decision`, `method`) | M, A |
| PUT | `/api/order-line/:id/technician` | Assign a technician | M, A |
| PUT | `/api/order-line/:id/status` | Start (1) or finish (2) a job, or save a work note | own T, M, A |
| GET | `/api/my-jobs` | Jobs of the logged-in technician | T |
| GET | `/api/order/:id/invoice` | Invoice data (completed orders whose total matches the last approval) | M, A |
| PUT | `/api/order/:id/payment` | Mark paid in cash (once) | M, A |
| POST | `/api/order/:id/resend-email` | Send the status link or "car is ready" email again | M, A |
| GET | `/api/dashboard` | Counters, cash totals and the 5 newest call-back requests | M, A |
| POST | `/api/public/callback` | Website "Request a call back" form. At most 5 a phone number per hour | Public |
| GET | `/api/callbacks?status=new\|called\|all` | Call-back requests, newest first, with `new_count` | M, A |
| PUT | `/api/callback/:id/called` | Mark a request as called (409 if someone already did) | M, A |
| GET | `/api/public/order/:hash` | Customer status page data (safe fields only, no prices) | Public |

`POST /api/order/:id/line` is the one endpoint added beyond the PRD list, for FR-EST-04 (extra work).
