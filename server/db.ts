import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set");
}

const url = new URL(databaseUrl);

const pool = new Pool({
  host: url.hostname,
  port: url.port ? Number(url.port) : 5432,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ssl:
    url.searchParams.get("sslmode") === "disable"
      ? false
      : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
export { pool };