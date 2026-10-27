// Loads backend/.env into process.env. Import it before anything that reads settings (such as config/db.js).
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });
