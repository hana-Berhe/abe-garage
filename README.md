# Abe Garage

One web system to run a car repair shop: customers and cars, estimates with 15% VAT, customer approval, technician jobs, invoices and cash payment, and a private status link for customers.

The product spec is **Abe Garage PRD v1.1**. Stack: React 18 + Vite, Express 4, MySQL 8 (10 tables, plain SQL with `mysql2`).

## Repository layout

```
abe-garage/
├── backend/          Express REST API (ES modules): src/api/<feature>/{routes,controller,service,validations}, db, tests
├── frontend/         React + Vite app: src/features/<feature>, layouts, shared, styles
├── docs/             one folder per topic: setup/, testing/, api/, architecture/, database/, postman/
└── package.json      npm workspaces: one install, scripts for both apps
```

See [docs/architecture](docs/architecture/README.md) for the full tree and the rules every module follows.

## Run it locally

You need Node 20 (see `.nvmrc`) and MySQL 8. The full step-by-step guide, with Windows commands and a fix-it table, is in [docs/setup](docs/setup/README.md). In short:

```bash
npm install
cp backend/.env.example backend/.env        # fill in DB_PASSWORD, JWT_SECRET (32+ chars), INSTALL_SECRET, INSTALL_ADMIN_*
cp frontend/.env.example frontend/.env
npm run dev:api
curl -X POST -H "X-Setup-Key: <INSTALL_SECRET>" http://localhost:8000/api/install  # once
npm run seed                                  # optional demo data
npm run dev                                   # API on :8000, website on :5173
```

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev:api` / `npm run dev:web` | start one app in watch mode |
| `npm run dev` | start both in one terminal (Ctrl+C stops both) |
| `npm run seed` | load demo data |
| `npm test` | API unit tests (no database needed) |
| `npm run test:integration` | API integration tests against a throw-away MySQL test database (see below) |
| `npm run build` | production build of the web app |

## Tests

`npm test` (unit, no database), `npm run test:integration` (real API against a throw-away MySQL test database) and `npm run build`. CI runs all three on every pull request. Setup for the integration tests, how to run one file, and how to write a new test are in [docs/testing](docs/testing/README.md).

## Team rules

Branches: `main` ← `dev` ← `feat/<ID>-short-name` (for example `feat/FR-CUS-03-customer-search`). Every pull request names its requirement IDs, passes its Postman tests and gets one review. Secrets stay in `.env`; only `.env.example` is committed. Database changes only through `backend/db/schema.sql`.
