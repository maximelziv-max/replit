import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const url = new URL(databaseUrl);

// hostname without port
const host = url.hostname;
const port = url.port ? parseInt(url.port, 10) : 5432;

// IMPORTANT: decode credentials safely
const user = decodeURIComponent(url.username);
const password = decodeURIComponent(url.password);

// pathname starts with "/"
const database = url.pathname.startsWith("/")
  ? url.pathname.slice(1)
  : url.pathname;

const sslmode = url.searchParams.get("sslmode") ?? "require";
const ssl =
  sslmode === "disable"
    ? false
    : {
        rejectUnauthorized: false,
      };

export const pool = new Pool({
  host,
  port,
  user,
  password,
  database,
  ssl,
});
