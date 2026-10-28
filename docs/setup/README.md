# Run Abe Garage on your computer

You need **Node 20** (the version in `.nvmrc`), **MySQL 8** and **Git**. Steps 1 to 5 happen once. After that, you only need step 6 each day.

Commands are shown for Mac/Linux first, with the Windows version under them where it differs.

## 1. Get the code

```bash
git clone https://github.com/hana-Berhe/abe-garage.git
cd abe-garage
nvm use        # optional: switches to Node 20 if you use nvm
npm install    # installs the API and the website together
```

Work from `dev`. It has the latest work.

## 2. Make the database

Sign in to MySQL as root (MySQL command line or MySQL Workbench) and run:

```sql
CREATE DATABASE abe_garage CHARACTER SET utf8mb4;
CREATE USER 'abe'@'localhost' IDENTIFIED BY 'abe_pass';
GRANT ALL ON abe_garage.* TO 'abe'@'localhost';
```

## 3. Make the two settings files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Windows:

```
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Open `backend/.env` and change these lines:

```
DB_PASSWORD=abe_pass
JWT_SECRET=my-long-secret-for-abe-garage-123456
INSTALL_SECRET=abe-garage-setup-key-2026
INSTALL_ADMIN_PASSWORD=admin12345
```

- `JWT_SECRET` must be at least 32 characters, or the API refuses to start.
- `INSTALL_SECRET` must be at least 16 characters.
- `frontend/.env` needs no changes. It points the website at `http://localhost:8000`.

## 4. Start the API and create the tables (once)

In one terminal, start the API:

```bash
npm run dev:api
```

Leave it running. In a **second** terminal, inside the `abe-garage` folder, run:

```bash
curl -X POST -H "X-Setup-Key: abe-garage-setup-key-2026" http://localhost:8000/api/install
```

On Windows, type `curl.exe` instead of `curl`.

This creates every table, the roles, the garage settings and the first admin account. It only works once. After that it answers 403.

## 5. Add demo data (optional)

```bash
npm run seed
```

This adds demo staff, customers, cars, services and orders.

A new database does **not** need migrations, because the install step already includes every change. Run `npm run migrate --workspace backend` only to update an older database.

## 6. Start the app (every day)

```bash
npm run dev
```

This starts the API (`api`, port 8000) and the website (`web`, port 5173) in one terminal. It works on Windows too. `Ctrl + C` stops both.

To run them in separate terminals instead, use `npm run dev:api` and `npm run dev:web`.

Then open **http://localhost:5173**.

## 7. Sign in

Go to http://localhost:5173/login.

| Who | Email | Password |
| --- | --- | --- |
| Admin | admin@abegarage.com | admin12345 |
| Manager | dana@abegarage.com | Password123 |
| Technician | sam@abegarage.com | Password123 |

The admin comes from `INSTALL_ADMIN_EMAIL` and `INSTALL_ADMIN_PASSWORD` in `backend/.env`. The manager and technician come from the demo data in step 5.

## Emails (optional)

Leave `SMTP_HOST` empty and the app skips sending emails. Everything else still works. To send real status and password-reset emails, fill in the `SMTP_*` lines and `MAIL_FROM` in `backend/.env`.

## If something goes wrong

| What you see | Why | Fix |
| --- | --- | --- |
| `Missing DB_USER in .env` (or another name) | `backend/.env` is missing or incomplete | Do step 3 again |
| `JWT_SECRET ... at least 32 characters` | The secret is too short | Use a longer `JWT_SECRET` |
| `Access denied for user 'abe'` | The password doesn't match the database user | Make `DB_PASSWORD` match step 2 |
| `EADDRINUSE` | Something else is using port 8000 or 5173 | Close the other app, or change `PORT` in `backend/.env` and `VITE_API_URL` in `frontend/.env` to match |
| The website says it can't reach the server | The API isn't running | Start it with `npm run dev` or `npm run dev:api` |
| The install command says the key is wrong | `X-Setup-Key` doesn't match | Use exactly the `INSTALL_SECRET` value |
| The install command answers 403 | Setup has already run | Nothing to do. Sign in. |
| `curl` is not found on Windows | Old Windows version | Install Git and run the command in Git Bash |
