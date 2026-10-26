# Architecture

Three tiers and one API. React pages talk only to the Express REST API, and only the API talks to MySQL. Email goes one way, from the API to the customer, and only after the data is saved.

```
apps/web (React + Vite, :5173)  ──HTTP JSON──▶  apps/api (Express, :8000)  ──SQL──▶  MySQL 8 (9 tables)
                                                       └──SMTP──▶ customer email
```

## API (`apps/api`)

```
apps/api/
├── src/
│   ├── app.js                 Express app: CORS, JSON, routes, error handler
│   ├── server.js              reads .env and starts the server
│   ├── routes.js              mounts every module's router
│   ├── config/db.js           MySQL pool and withTransaction()
│   ├── middlewares/
│   │   ├── auth.js            verifyToken, hasRole([...]), ROLES
│   │   └── error-handler.js   every error becomes { status, message, data }
│   ├── modules/               one folder per feature
│   │   └── <feature>/
│   │       ├── <name>.routes.js      URL + middleware only
│   │       ├── <name>.controller.js  reads the request, calls the service, answers
│   │       ├── <name>.validator.js   checks input, 400 with the field name
│   │       └── <name>.service.js     business rules and SQL (? placeholders only)
│   └── shared/                money, mailer, pagination, responses, validation helpers
├── db/
│   ├── schema.sql             the 9 tables (only Member 1 changes it)
│   └── seeds/seed.js          demo data for local work
└── tests/unit/                node:test unit tests
```

Modules: `install`, `employees`, `settings`, `customers`, `vehicles`, `services`, `orders` (orders, approval, technician jobs, history, emails), `invoices`, `public`, `dashboard`.

A module uses another module through its service, never by writing to that module's tables.

## Web (`apps/web`)

```
apps/web/src/
├── main.jsx                   providers and router
├── app/App.jsx                every route, with PrivateAuthRoute and roles
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
└── styles/                    design tokens (yellow and black design, v3) and app CSS
```

Pages never call `fetch` and never hold business rules. Money shown before saving is a preview; the server's numbers are the ones stored.

## Rules every module follows

| Concern | Rule |
| --- | --- |
| Login | bcrypt check, then a JWT valid 24 h holding id, role and name |
| Roles | `hasRole([...])` on every staff route; the server check is the real one |
| Input | checked in the validator; 400 with `{ field }` so the form shows it under the right input |
| Answers | `{ status, message, data }` with the right HTTP code |
| Multi-table saves | one transaction (`withTransaction`) |
| Money | `shared/money.js` only; DECIMAL(10,2); VAT added on top of the subtotal |
| Stale edits | the page sends back the `updated_at` it loaded; a stale save gets 409 |
| Email | after commit; `email_sent` or `email_failed` written to the order history |
| Printing | browser print CSS, no PDF library |
| Deleting | customers, cars, staff and services are deactivated, never deleted |
