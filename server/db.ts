import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

// Проверка, что переменная окружения есть
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// Создаём пул подключений к PostgreSQL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // важно для Timeweb
  },
});

// Инициализируем drizzle
export const db = drizzle(pool, {
  schema,
  logger: true,
});