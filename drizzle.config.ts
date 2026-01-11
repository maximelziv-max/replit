import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./shared/schema.ts",
  out: "./migrations",

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  // 🔴 ВАЖНО: игнорируем системные таблицы
  introspection: {
    ignoreTables: ["spatial_ref_sys"],
  },
});