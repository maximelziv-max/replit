import fs from "fs";
import os from "os";
import path from "path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

/**
 * ВАЖНО:
 * 1) В Timeweb используй переменную DATABASE_URL (не DATABASE_URL и не DATABASE_URL).
 * 2) Пароль в URL должен быть URL-encoded (особенно если есть + ? ! и т.п.)
 * 3) Для TLS Timeweb лучше передавать CA-сертификат, если он есть.
 */

function encodePasswordForUrl(password: string) {
  // Чтобы в URL не ломались символы вроде + ? !
  return encodeURIComponent(password);
}

function buildConnectionStringFromParts() {
  // Если хочешь "зашить" логин/пароль — делай это ТОЛЬКО локально, не пушь в GitHub.
  // Лучше положи эти значения в .env локально или в переменные Timeweb.

  const host = process.env.DB_HOST || ""; // например: 7f3169f83bd8013cf5dd364a.twc1.net
  const port = Number(process.env.DB_PORT || "5432");
  const user = process.env.DB_USER || ""; // например: gen_user
  const passwordRaw = process.env.DB_PASSWORD || ""; // например: v~+1+6?in!.rwC
  const database = process.env.DB_NAME || ""; // например: hr_prosto или default_db

  if (!host || !user || !passwordRaw || !database) return null;

  const password = encodePasswordForUrl(passwordRaw);

  // Timeweb обычно требует TLS; в URL можно использовать verify-full/require
  const sslmode = process.env.DB_SSLMODE || "verify-full";

  return `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=${sslmode}`;
}

function getDatabaseUrl(): string {
  // 1) основной вариант — DATABASE_URL из окружения
  const fromEnv = process.env.DATABASE_URL || process.env.DATABASE_URL;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();

  // 2) запасной вариант — собрать из DB_HOST/DB_USER/DB_PASSWORD/DB_NAME
  const fromParts = buildConnectionStringFromParts();
  if (fromParts) return fromParts;

  throw new Error(
    "No database connection provided. Set DATABASE_URL (recommended) or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME.",
  );
}

function loadTimewebCA(): string | null {
  // Timeweb предлагает класть CA в ~/.cloud-certs/root.crt
  const caPath = path.join(os.homedir(), ".cloud-certs", "root.crt");
  try {
    if (fs.existsSync(caPath)) return fs.readFileSync(caPath, "utf-8");
  } catch {
    // ignore
  }
  return null;
}

const connectionString = getDatabaseUrl();

const ca = loadTimewebCA();

// Вариант SSL:
// - если есть CA → делаем verify (как в инструкции Timeweb)
// - если нет CA → fallback: rejectUnauthorized false (чтобы не падало в средах без CA)
const ssl =
  ca
    ? { rejectUnauthorized: true, ca }
    : { rejectUnauthorized: false };

export const pool = new Pool({
  connectionString,
  ssl,
});

export const db = drizzle(pool, { schema });
