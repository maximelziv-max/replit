import fs from "fs";
import path from "path";
import os from "os";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set");
}

// путь к сертификату Timeweb
const sslCertPath = path.join(
  os.homedir(),
  ".cloud-certs",
  "root.crt"
);

const pool = new Pool({
  connectionString: databaseUrl,

  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(sslCertPath, "utf-8"),
  },
});

// ✅ ЭТОТ экспорт нужен storage.ts
export const db = drizzle(pool, { schema });

// полезно для health/debug
export { pool };