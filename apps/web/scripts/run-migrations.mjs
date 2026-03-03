#!/usr/bin/env node
/**
 * Применяет миграции из engine/Aistroyk/supabase/migrations к базе Supabase.
 * Нужна строка подключения к БД (Session mode или Direct).
 *
 * Запуск из apps/web:
 *   SUPABASE_DB_URL='postgresql://postgres.[ref]:[PASSWORD]@...' npm run db:migrate
 *
 * SUPABASE_DB_URL взять в Supabase Dashboard → Project Settings → Database → Connection string (URI).
 * Пароль — тот, что задавали при создании проекта (или смените в Database → Reset password).
 */

import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadEnv() {
  const cwd = process.cwd();
  const env = {};
  for (const f of [".env.migrate", ".env.production", ".env.local", ".env"]) {
    const p = path.join(cwd, f);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf8");
      for (const line of content.split("\n")) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (m && m[2] !== undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
      }
    }
  }
  return env;
}

const env = await loadEnv();
const dbUrl =
  process.env.SUPABASE_DB_URL ||
  process.env.DATABASE_URL ||
  env.SUPABASE_DB_URL ||
  env.DATABASE_URL;

if (!dbUrl) {
  console.error("Задайте SUPABASE_DB_URL (или DATABASE_URL) — строка подключения к БД.");
  console.error("Supabase Dashboard → Project Settings → Database → Connection string (URI).");
  process.exit(1);
}

const migrationsDir = path.resolve(__dirname, "../../../engine/Aistroyk/supabase/migrations");
if (!fs.existsSync(migrationsDir)) {
  console.error("Папка миграций не найдена:", migrationsDir);
  process.exit(1);
}

let files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
const fromFile = process.env.RUN_MIGRATIONS_FROM || env.RUN_MIGRATIONS_FROM;
if (fromFile) {
  const idx = files.indexOf(fromFile);
  if (idx >= 0) files = files.slice(idx);
  else files = files.filter((f) => f >= fromFile);
}
if (files.length === 0) {
  console.error("Нет .sql файлов в", migrationsDir);
  process.exit(1);
}

console.log("Миграций к применению:", files.length);
const client = new pg.Client({ connectionString: dbUrl });

try {
  await client.connect();
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf8");
    process.stdout.write("  " + file + " ... ");
    try {
      await client.query(sql);
      console.log("OK");
    } catch (err) {
      console.log("FAIL");
      console.error(err.message);
      process.exit(1);
    }
  }
  console.log("Готово. Таблицы созданы.");
} finally {
  await client.end();
}
