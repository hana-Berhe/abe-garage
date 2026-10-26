require("dotenv").config();
const app = require("./app");

for (const key of ["DB_HOST", "DB_NAME", "DB_USER", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in .env (see .env.example)`);
    process.exit(1);
  }
}

const port = Number(process.env.PORT) || 8000;
app.listen(port, () => console.log(`Abe Garage API on http://localhost:${port}`));
