# Abe Garage

One web system to run a car repair shop: customers and cars, estimates with 15% VAT, customer approval, technician jobs, invoices and cash payment, and a private status link for customers.

The product spec is **Abe Garage PRD v1.1**. Stack: React 18 + Vite, Express 4, MySQL 8 (10 tables, plain SQL with `mysql2`).

## Repository layout

```
abe-garage/
├── apps/
│   ├── api/          Express REST API: src/modules/<feature>, db/schema.sql, db/seeds, tests
│   └── web/          React + Vite app: src/features/<feature>, layouts, shared, styles
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

cp apps/api/.env.example apps/api/.env        # fill in DB_PASSWORD, JWT_SECRET, INSTALL_ADMIN_*
cp apps/web/.env.example apps/web/.env

npm run dev:api                               # http://localhost:8000
curl -X POST http://localhost:8000/api/install  # once: tables, roles, settings and the first admin
npm run seed                                  # optional: demo staff, customers, services and orders
npm run dev:web                               # http://localhost:5173
```

Log in at http://localhost:5173/login with `INSTALL_ADMIN_EMAIL` and `INSTALL_ADMIN_PASSWORD` from `apps/api/.env`.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev:api` / `npm run dev:web` | start one app in watch mode |
| `npm run dev` | start both |
| `npm run seed` | load demo data |
| `npm test` | API unit tests |
| `npm run build` | production build of the web app |

## Team rules

Branches: `main` ← `dev` ← `feat/<ID>-short-name` (for example `feat/FR-CUS-03-customer-search`). Every pull request names its requirement IDs, passes its Postman tests and gets one review. Secrets stay in `.env`; only `.env.example` is committed. Database changes only through `apps/api/db/schema.sql`.
