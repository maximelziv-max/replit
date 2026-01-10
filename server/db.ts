import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set");
}

// 1) Парсим DATABASE_URL безопасно и с понятной ошибкой
let url: URL;
try {
  url = new URL(databaseUrl);
} catch (e) {
  console.error("❌ INVALID DATABASE_URL:", databaseUrl);
  throw e;
}

// 2) Собираем параметры подключения (важно: decodeURIComponent!)
const host = url.hostname;
const port = url.port ? Number(url.port) : 5432;
const user = decodeURIComponent(url.username);
const password = decodeURIComponent(url.password);
const database = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;

// 3) SSL для Timeweb/PaaS
// Если sslmode=disable -> без SSL, иначе включаем SSL без проверки CA (это норм для PaaS)
const sslmode = url.searchParams.get("sslmode") ?? "require";
const ssl =
  sslmode === "disable"
    ? false
    : {
        rejectUnauthorized: false,
      };

// 4) Pool + Drizzle
const pool = new Pool({
  host,
  port,
  user,
  password,
  database,
  ssl,
});

// ✅ Экспорт db (его ждёт storage.ts)
export const db = drizzle(pool, { schema });

// (опционально) если где-то нужен pool напрямую
export { pool };