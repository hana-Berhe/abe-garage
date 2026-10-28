# Run the tests

There are three kinds of checks. CI runs all of them on every pull request, so run them before you push.

| Command | What it checks | Needs MySQL? | Time |
| --- | --- | --- | --- |
| `npm test` | API unit tests | No | about 1 second |
| `npm run test:integration` | The real API over HTTP, against a test database | Yes | about 25 seconds |
| `npm run build` | The website builds | No | a few seconds |

## Unit tests

```bash
npm test
```

These live in `backend/tests/unit/`. They check money and VAT, time zones, PATCH merging and vehicle input rules. They need no database and no `.env` file.

## Integration tests

These live in `backend/tests/integration/`. Each file starts the real API, creates a fresh empty database, installs the app into it, and calls the API over HTTP.

They cover:

- the full visit: customer, order, approval, jobs, invoice, cash payment, status page
- every role on every address
- revoked and expired logins
- duplicates and bad input
- roll-back, and two people saving at once
- invoices that never change, and money rounding
- mail failures and password reset
- the shared error format and request IDs
- 1000 orders against the 2-second target

### One-time setup

1. Give a MySQL user the right to create and drop databases. The tests create and drop their own database.

   ```sql
   CREATE USER 'abe'@'localhost' IDENTIFIED BY 'change_me';
   GRANT ALL ON *.* TO 'abe'@'localhost';
   ```

   You can reuse the `abe` user from [setup](../setup/README.md) instead. It just needs `GRANT ALL ON *.*`, not only on `abe_garage`.

2. Make the test settings file:

   ```bash
   cp backend/.env.test.example backend/.env.test
   ```

   On Windows: `copy backend\.env.test.example backend\.env.test`

3. Fill in `DB_USER` and `DB_PASSWORD` in `backend/.env.test`. Leave `TEST_DB_NAME` as `abe_garage_test`.

> **The test database is wiped on every run.** Any name that doesn't end in `_test` is refused, so the tests can never touch your real `abe_garage` data. Never commit `backend/.env.test`.

### Run them

```bash
npm run test:integration
```

The files run one at a time, because they share one test database.

## Run one file

```bash
node --test backend/tests/unit/money.test.js
node --test --test-concurrency=1 backend/tests/integration/workflow.test.js
```

## The website build

```bash
npm run build
```

This catches broken imports and JSX errors in the frontend. There are no frontend unit tests yet. When we add them, they go in `frontend/tests/`.

## Postman

The Postman collection in [`docs/postman/`](../postman/README.md) calls every API address, with success and error examples. Run it by hand on a freshly installed database, or from the command line with `newman`. The README there explains how.

## In CI

`.github/workflows/test.yml` runs on every pull request and every push to `main` and `dev`. It does the following:

1. Starts MySQL 8.
2. Installs with `npm ci`, using the Node version in `.nvmrc`.
3. Runs `npm test`.
4. Runs the integration tests.
5. Runs `npm run build`.

A pull request should only be merged when this check is green.

## Writing a new test

- **Unit test:** a pure function with no database, such as money, dates or input rules. Add `backend/tests/unit/<name>.test.js`.
- **Integration test:** anything that goes through a route. Add `backend/tests/integration/<name>.test.js`, call `useApp()` from `helpers.js` at the top, then use `api()`, `login()`, `newCustomer()` and `newOrder()`.

Both use Node's built-in `node:test` and `node:assert/strict`. There's nothing extra to install.
