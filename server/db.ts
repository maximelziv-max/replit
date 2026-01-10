import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

function reqEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`${name} is not set`);
  return v.trim();
}

const host = reqEnv("DB_HOST");
const port = Number(process.env.DB_PORT || "5432");
const database = reqEnv("DB_NAME");
const user = reqEnv("DB_USER");
const password = reqEnv("DB_PASSWORD");

// TLS
const ca = process.env.SSL_CA?.trim();
const ssl = ca
  ? { rejectUnauthorized: true, ca }
  : { rejectUnauthorized: false };

export const pool = new Pool({
  host,
  port,
  database,
  user,
  password,
  ssl,
});

export const db = drizzle(pool, { schema });
