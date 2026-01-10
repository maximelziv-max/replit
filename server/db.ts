import fs from "fs";
import os from "os";
import path from "path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

/**
 * Ожидаем переменную окружения:
 *   DATABASE_URL = postgresql://user:pass@host:5432/db?sslmode=verify-full
 *
 * Для Timeweb TLS:
 *  - лучше всего положить сертификат в переменную SSL_CA (целый PEM)
 *  - или файл ~/.cloud-certs/root.crt (как в инструкции Timeweb)
 */
function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

/**
 * Иногда DATABASE_URL приходит с паролем без URL-encoding (например: v~+1+6?in!.rwC)
 * Тогда new URL(...) может падать, или драйвер ломает querystring.
 * Это исправляем, кодируя пароль между ":" и "@", если нужно.
 */
function normalizeDatabaseUrl(raw: string): string {
  // если уже нормально парсится — возвращаем как есть
  try {
    new URL(raw);
    return raw;
  } catch {
    // пробуем починить: postgresql://USER:PASSWORD@HOST/DB...
    //                    ^^^^^^ пароль кодируем через encodeURIComponent
    const m = raw.match(/^(postgres(?:ql)?:\/\/)([^:\/?#]+):([^@]+)@(.+)$/i);
    if (!m) return raw;

    const [, proto, user, pass, rest] = m;
    const encodedPass = encodeURIComponent(pass);
    const fixed = `${proto}${user}:${encodedPass}@${rest}`;

    // проверка
    try {
      new URL(fixed);
      return fixed;
    } catch {
      return raw;
    }
  }
}

function readTimewebCaFromFile(): string | undefined {
  const caPath = path.join(os.homedir(), ".cloud-certs", "root.crt");
  try {
    if (fs.existsSync(caPath)) {
      const ca = fs.readFileSync(caPath, "utf-8");
      return ca && ca.trim() ? ca : undefined;
    }
  } catch {
    // ignore
  }
  return undefined;
}

function buildSslOptions(url: URL) {
  const sslmode = (url.searchParams.get("sslmode") || "").toLowerCase();

  // sslmode=disable => без TLS
  if (sslmode === "disable") return false;

  // Если есть CA (переменная или файл) — включаем строгую проверку
  const caFromEnv = getEnv("SSL_CA");
  const caFromFile = readTimewebCaFromFile();
  const ca = caFromEnv ?? caFromFile;

  if (ca) {
    return {
      rejectUnauthorized: true,
      ca,
    } as const;
  }

  // Если CA нет — работаем в "мягком" режиме (подходит для Replit/локально)
  return {
    rejectUnauthorized: false,
  } as const;
}

// 1) Берём строку подключения
const raw = getEnv("DATABASE_URL");
if (!raw) {
  throw new Error("DATABASE_URL must be set");
}

// 2) Нормализуем (лечим спецсимволы в пароле, если были)
const normalized = normalizeDatabaseUrl(raw);

// 3) Парсим URL
let parsed: URL;
try {
  parsed = new URL(normalized);
} catch (e) {
  // покажем безопасную подсказку (не логируем пароль целиком)
  const hint = normalized.replace(/:(.*?)@/, ":***@");
  throw new Error(`Invalid DATABASE_URL. Example (masked): ${hint}`);
}

// 4) Собираем SSL опции
const ssl = buildSslOptions(parsed);

// 5) Создаём pool
export const pool = new Pool({
  connectionString: normalized,
  ssl,
});

// 6) Экспортируем drizzle db (ВАЖНО: имя именно db)
export const db = drizzle(pool, { schema });
