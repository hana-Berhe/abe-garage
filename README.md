# Abe Garage

One web system to run a car repair shop: customers and cars, estimates with 15% VAT, customer approval, technician jobs, invoices and cash payment, and a private status link for customers.

The product spec is **Abe Garage PRD v1.1**. Stack: React 18 + Vite, Express 4, MySQL 8 (9 tables, plain SQL with `mysql2`).

## Run it locally

You need Node 18+ and MySQL 8.

```bash
# 1. Database and an app user
mysql -u root -p -e "CREATE DATABASE abe_garage CHARACTER SET utf8mb4;
  CREATE USER 'abe'@'localhost' IDENTIFIED BY 'change_me';
  GRANT ALL ON abe_garage.* TO 'abe'@'localhost';"

# 2. Backend on http://localhost:8000
cd backend
cp .env.example .env        # fill in DB_PASSWORD, JWT_SECRET, INSTALL_ADMIN_*
npm install
npm run dev

# 3. Create tables, roles, settings and the first admin (once)
curl http://localhost:8000/install

# 4. Frontend on http://localhost:5173
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

Log in at http://localhost:5173/login with `INSTALL_ADMIN_EMAIL` and `INSTALL_ADMIN_PASSWORD` from `backend/.env`.

## Layout

```
backend/
  app.js, server.js
  config/db.js                 pool + withTransaction()
  middlewares/auth.js          verifyToken, hasRole([...])
  middlewares/errorHandler.js  every error -> { status, message, data }
  routes/ controllers/ services/   one file of each per module
  utils/ money.js, mailer.js, respond.js, validate.js, pagination.js
  sql/schema.sql               the 9 tables (only Member 1 edits it)
frontend/src/
  App.jsx, context/AuthContext.jsx
  services/api.js (fetchApi), <module>.service.js
  components/ Header, Footer, AdminMenu, PrivateAuthRoute, Pagination, SearchBox, StatusBadge, ConfirmDialog, Field
  pages/public/, pages/admin/<module>/
```

## The pattern every module copies

The staff module (`employee.*`) is the reference:

- **Route** lists the URL and middleware only: `verifyToken, hasRole([M, A])`.
- **Controller** checks input (400 with `{ field }`), calls the service, answers with `ok()` / `created()`.
- **Service** holds the rules and the SQL, with `?` placeholders only. Multi-table saves use `withTransaction()`.
- **Edits** send back the `updated_at` they loaded; a stale save gets 409 (NFR-16).
- **Pages** call a `<module>.service.js`, never `fetch`. Forms show `error.message` under `error.field`.

## Status

| Area | State |
| --- | --- |
| Setup: schema, `/install`, install lock (FR-INS) | Done |
| Login, roles, logout, change password (FR-AUTH) | Done |
| Staff list, add, edit, deactivate (FR-EMP) | Done |
| Garage settings and VAT rate | Done |
| Shared parts: menu, PrivateAuthRoute, Pagination, SearchBox, badges, fetchApi | Done |
| Money rules (`utils/money.js`, AT-02 test) | Done |
| Customers and cars (Member 2) | To do |
| Services, orders, approval, My jobs (Member 3) | To do |
| Invoice, payment, status page, emails, dashboard (Member 4) | To do |

## Tests

```bash
cd backend && npm test
```

## Team rules

Branches: `main` ← `dev` ← `feat/<ID>-short-name` (for example `feat/FR-CUS-03-customer-search`). Every pull request names its requirement IDs, passes its Postman tests and gets one review. Secrets stay in `.env`; only `.env.example` is committed.
