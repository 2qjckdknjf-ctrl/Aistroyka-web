#!/usr/bin/env node
/**
 * Заливает несколько демо-файлов (мини-изображения) в Supabase Storage (бакет media)
 * и создаёт записи в таблице media. Нужен хотя бы один проект в БД.
 *
 * Запуск из apps/web:
 *   node scripts/seed-supabase-media.mjs
 *
 * Переменные: NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY (из .env.production).
 * Если загрузка в Storage запрещена по RLS — добавь SUPABASE_SERVICE_ROLE_KEY в .env (не коммитить).
 */

import { createClient } from "@supabase/supabase-js";

async function loadEnv() {
  const fs = await import("fs");
  const path = await import("path");
  const cwd = process.cwd();
  for (const f of [".env.production", ".env.local", ".env"]) {
    const p = path.join(cwd, f);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf8");
      const env = {};
      for (const line of content.split("\n")) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
      }
      return env;
    }
  }
  return {};
}

// Минимальный валидный PNG 1x1 пиксель
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const BUCKET = "media";
const COUNT = 3;

const env = await loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const key = serviceKey || anonKey;

if (!url || !key) {
  console.error("Нужны NEXT_PUBLIC_SUPABASE_URL и (NEXT_PUBLIC_SUPABASE_ANON_KEY или SUPABASE_SERVICE_ROLE_KEY) в .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { data: projects, error: listErr } = await supabase.from("projects").select("id").limit(1);
  if (listErr) {
    console.error("Ошибка чтения projects:", listErr.message);
    if (listErr.message.includes("schema cache") || listErr.message.includes("not find")) {
      console.error("\nТаблицы в Supabase не найдены. Нужно применить миграции:");
      console.error("  Supabase Dashboard → SQL Editor → выполнить миграции из engine/Aistroyk/supabase/migrations/");
      console.error("  (сначала 20250222000000_initial_schema.sql, затем 20250222100000_media_and_ai_analysis.sql и др.)");
      console.error("  Либо: supabase db push (если настроен Supabase CLI).");
    }
    process.exit(1);
  }
  if (!projects?.length) {
    console.error("В БД нет ни одного проекта. Создайте проект на сайте (aistroyka.ai → Проекты → Новый), затем запустите скрипт снова.");
    process.exit(1);
  }
  const projectId = projects[0].id;
  console.log("Проект для загрузки:", projectId);

  const buffer = Buffer.from(TINY_PNG_BASE64, "base64");
  let uploaded = 0;

  for (let i = 0; i < COUNT; i++) {
    const path = `${projectId}/${crypto.randomUUID()}.png`;
    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType: "image/png",
      upsert: false,
    });
    if (uploadErr) {
      console.error("Ошибка загрузки в Storage:", uploadErr.message);
      if (!serviceKey && uploadErr.message.includes("policy")) {
        console.error("Подсказка: добавьте SUPABASE_SERVICE_ROLE_KEY в .env для обхода RLS Storage.");
      }
      process.exit(1);
    }
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const { error: insertErr } = await supabase.from("media").insert({
      project_id: projectId,
      type: "image",
      file_url: publicUrl,
    });
    if (insertErr) {
      console.error("Ошибка записи в media:", insertErr.message);
      process.exit(1);
    }
    uploaded++;
    console.log("Загружено:", path);
  }

  console.log("Готово. Загружено файлов:", uploaded);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
