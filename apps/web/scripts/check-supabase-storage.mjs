#!/usr/bin/env node
/**
 * Проверяет: есть ли бакет media в Supabase Storage и записи в таблице media.
 * Запуск из apps/web (подхватит .env.production или .env.local):
 *   node scripts/check-supabase-storage.mjs
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

const env = await loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Нужны NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.production или .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);
const BUCKET = "media";

async function main() {
  console.log("Supabase URL:", url.replace(/https?:\/\//, ""));
  console.log("Бакет:", BUCKET);

  let filesCount = 0;
  try {
    const { data: root, error } = await supabase.storage.from(BUCKET).list("", { limit: 500 });
    if (error) {
      console.log("Storage list:", error.message, "(бакет не создан или RLS)");
    } else if (root && root.length) {
      for (const item of root) {
        const { data: sub } = await supabase.storage.from(BUCKET).list(item.name, { limit: 1000 });
        filesCount += sub?.length ?? 0;
      }
      console.log("Файлов в бакете media (по папкам project_id):", filesCount);
    } else {
      console.log("Файлов в бакете media: 0");
    }
  } catch (e) {
    console.log("Storage:", e.message);
  }

  const { count, error } = await supabase.from("media").select("id", { count: "exact", head: true });
  if (error) {
    console.log("Таблица media:", error.message);
  } else {
    console.log("Записей в таблице media:", count ?? 0);
  }

  if ((filesCount === 0 && (count ?? 0) === 0)) {
    console.log("\nИтог: файлов пока нет. Залейте фото через сайт (проект → загрузка) или проверьте бакет в Dashboard → Storage.");
  } else {
    console.log("\nИтог: в Supabase есть данные (Storage и/или таблица media).");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
