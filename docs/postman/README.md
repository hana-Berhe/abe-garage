# Postman collection

`abe-garage.postman_collection.json` has one request for every API address, with success and error examples (72 requests, 157 checks). `abe-garage.postman_environment.json` holds only the base URL, the admin login and the setup key. The password and key are left empty: never commit real ones.

1. Import both files into Postman and pick the **Abe Garage local** environment.
2. Set `baseUrl` (default `http://localhost:8000`), `adminEmail` and `adminPassword` (the `INSTALL_ADMIN_*` values from `apps/api/.env`), and `setupKey` (`INSTALL_SECRET`).
3. On an **empty** database, run the whole collection in order (it starts with setup). Each step saves the tokens and ids the next steps need (they are collection variables).

The run takes about 3 seconds and goes from signing in to employees, settings, services, customers and cars, then the full order: estimate → approval → jobs → invoice → cash → status page. Error examples (400, 401, 403, 404, 409) sit next to the requests they belong to.

Emails, phones and plates use `{{$timestamp}}`, so you can run the collection again on the same database. On a second run only **0 Setup / Install** fails, because setup answers 403 once installed. That is expected.

From the command line:

```bash
npx newman run docs/postman/abe-garage.postman_collection.json \
  -e docs/postman/abe-garage.postman_environment.json \
  --env-var adminPassword=YOUR_ADMIN_PASSWORD
```
