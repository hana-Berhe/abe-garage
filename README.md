# Abe Garage

One web system to run a car repair shop: customers and cars, estimates with 15% VAT, customer approval, technician jobs, invoices and cash payment, and a private status link for customers.

The product spec is **Abe Garage PRD v1.1**. Stack: React 18 + Vite, Express 4, MySQL 8 (10 tables, plain SQL with `mysql2`).

## Repository layout

```
abe-garage/
├── backend/          Express REST API (ES modules): src/api/<feature>/{routes,controller,service,validations}, db, tests
├── frontend/         React + Vite app: src/features/<feature>, layouts, shared, styles
├── docs/             architecture, API list, database guide
└── package.json      npm workspaces: one install, scripts for both apps
```

See [docs/architecture.md](docs/architecture.md) for the full tree and the rules every module follows.

## Run it locally

You need Node 18+ and MySQL 8.

```bash
npm install                                   # installs both apps

# Database and an app user
mysql -u root -p -e "CREATE DATABASE abe_garage CHARACTER SET utf8mb4;
  CREATE USER 'abe'@'localhost' IDENTIFIED BY 'change_me';
  GRANT ALL ON abe_garage.* TO 'abe'@'localhost';"

cp backend/.env.example backend/.env        # fill in DB_PASSWORD, JWT_SECRET, INSTALL_SECRET, INSTALL_ADMIN_*
cp frontend/.env.example frontend/.env

npm run dev:api                               # http://localhost:8000
curl -X POST -H "X-Setup-Key: <INSTALL_SECRET>" http://localhost:8000/api/install  # once: tables, roles, settings, first admin
npm run seed                                  # optional: demo staff, customers, services and orders
npm run dev:web                               # http://localhost:5173
```

Log in at http://localhost:5173/login with `INSTALL_ADMIN_EMAIL` and `INSTALL_ADMIN_PASSWORD` from `backend/.env`.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev:api` / `npm run dev:web` | start one app in watch mode |
| `npm run dev` | start both |
| `npm run seed` | load demo data |
| `npm test` | API unit tests (no database needed) |
| `npm run test:integration` | API integration tests against a throw-away MySQL test database (see below) |
| `npm run build` | production build of the web app |

## Tests

- **Unit tests** (`npm test`) check money, time zones, PATCH merging and input rules. No database needed.
- **Integration tests** (`npm run test:integration`) start the real API and call it over HTTP. They cover the full visit (customer → order → approval → jobs → invoice → cash → status page), every role on every address, revoked and expired logins, duplicates and bad input, roll-back, two people saving at once, invoices that never change, money rounding, mail failures, password reset, the shared error format, and 1000 orders against the 2-second target.
  They need a MySQL user that may create and drop a database whose name ends in `_test`. Copy `backend/.env.test.example` to `backend/.env.test` and fill it in. **The test database is wiped on every run**, and a name that doesn't end in `_test` is refused.
- **GitHub Actions** (`.github/workflows/test.yml`) runs both, plus the web build, on every pull request.
- **Postman**: import `docs/postman/abe-garage.postman_collection.json` and `abe-garage.postman_environment.json`, set `baseUrl`, `adminEmail`, `adminPassword` and `setupKey`, then run the collection on a freshly installed database. See `docs/postman/README.md`.

## Team rules

Branches: `main` ← `dev` ← `feat/<ID>-short-name` (for example `feat/FR-CUS-03-customer-search`). Every pull request names its requirement IDs, passes its Postman tests and gets one review. Secrets stay in `.env`; only `.env.example` is committed. Database changes only through `backend/db/schema.sql`.
