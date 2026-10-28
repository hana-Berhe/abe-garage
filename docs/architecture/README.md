# Architecture

Three tiers and one API. React pages talk only to the Express REST API, and only the API talks to MySQL. Email goes one way, from the API to the customer, and only after the data is saved.

```
frontend (React + Vite, :5173)  ──HTTP JSON──▶  backend (Express, :8000)  ──SQL──▶  MySQL 8 (10 tables)
                                                       └──SMTP──▶ customer email
```

## API (`backend`)

The backend uses ES modules (`import` / `export`, `"type": "module"` in `backend/package.json`). Local imports always end in `.js`.

```
backend/
├── src/
│   ├── app.js                 Express app: request ID, CORS, JSON, /api, error handler
│   ├── server.js              checks .env, starts the server, shuts down cleanly
│   ├── routes.js              every URL prefix in one list (/customers, /orders, ...)
│   ├── config/
│   │   ├── env.js             loads backend/.env (imported first)
│   │   └── db.js              MySQL pool and withTransaction()
│   ├── middlewares/
│   │   ├── auth.js            verifyToken, hasRole([...]), ROLES
│   │   ├── validate.js        checks a route's Zod schemas, answers 400 with { errors }
│   │   └── error-handler.js   every error becomes { status, message, data }
│   ├── api/                   one folder per feature
│   │   └── <feature>/
│   │       ├── routes/<name>.routes.js            path after the prefix + middleware only
│   │       ├── controller/<name>.controller.js    reads the request, calls the service, answers
│   │       ├── validations/<name>.validation.js   Zod schemas for each route's input
│   │       └── service/<name>.service.js          business rules and SQL (? placeholders only)
│   └── shared/                money, mailer, pagination, responses, rules.js (shared Zod field schemas)
├── db/
│   ├── schema.sql             the 10 tables (only Member 1 changes it)
│   ├── migrations/            numbered change files, applied by `npm run migrate`
│   └── seeds/seed.js          demo data for local work
└── tests/
    ├── unit/                  node:test unit tests
    └── integration/           real API + MySQL test database
```

Features: `health`, `install`, `employees`, `settings`, `customers`, `vehicles`, `services`, `orders` (orders, approval, technician jobs, history, emails), `invoices`, `public`, `dashboard`.

A feature uses another feature through its service, never by writing to that feature's tables.

URLs: `/api` appears once, in `app.js`. Each feature prefix appears once, in `routes.js`. A route file only writes the part after its prefix, such as `"/"` or `"/:id/vehicles"`. When a feature answers under a second prefix, it gets a second route file named after that prefix, for example `orders/routes/order-line.routes.js` (mounted at `/order-lines`) and `vehicles/routes/customer-vehicle.routes.js` (mounted at `/customers`).

## Web (`frontend`)

```
frontend/src/
├── main.jsx                   mounts <App /> and global CSS
├── app/App.jsx                router and login session around every page
├── app/routes.jsx             every page address, with PrivateAuthRoute and roles
├── layouts/                   public site shell, staff shell, role-aware menu
├── features/                  one folder per feature
│   └── <feature>/
│       ├── <name>.api.js      calls the API through the shared client
│       ├── pages/             routed pages
│       └── components/        parts only this feature uses
├── shared/
│   ├── api/client.js          fetchApi: adds the token, logs out on 401
│   ├── components/            Alert, Field, Pagination, SearchBox, StatusBadge, Totals, ConfirmDialog
│   ├── constants/roles.js     1 Technician, 2 Manager, 3 Admin
│   └── lib/                   format (money, dates), money preview
└── styles/                    design tokens (charcoal and orange design, v4); website.css is only used inside <div class="ag"> (public pages, login, status)
```

Pages never call `fetch` and never hold business rules. Money shown before saving is a preview; the server's numbers are the ones stored.

## Rules every module follows

| Concern | Rule |
| --- | --- |
| Login | bcrypt check (also for unknown emails, so both take as long), then a JWT valid 1 hour holding id, role, name and token version |
| Roles | `hasRole([...])` on every staff route; the server check is the real one |
| Input | Zod schemas in the feature's validation file, run by `validate({ params, body, query })` in the route; 400 `Validation failed` with `{ errors: { field: message } }`, so the form shows the first one under the right input |
| Answers | `{ status, message, data }` with the right HTTP code |
| Multi-table saves | one transaction (`withTransaction`) |
| Money | `shared/money.js` only; DECIMAL(10,2); VAT added on top of the subtotal |
| Stale edits | the page sends back the `updated_at` it loaded; a stale save gets 409 |
| Email | after commit; `email_sent` or `email_failed` written to the order history |
| Printing | browser print CSS, no PDF library |
| Deleting | customers, cars, staff and services are deactivated, never deleted |
