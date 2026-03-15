#!/usr/bin/env node
/**
 * Verify project_cost_items table exists. Uses SUPABASE_DB_URL from env.
 * Prints only: OK or FAIL. No secrets.
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const cwd = path.resolve(__dirname, "..");
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

const env = loadEnv();
const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || env.SUPABASE_DB_URL || env.DATABASE_URL;

if (!dbUrl) {
  console.log("FAIL: SUPABASE_DB_URL not set");
  process.exit(1);
}

const client = new pg.Client({ connectionString: dbUrl });
try {
  await client.connect();
  const r = await client.query(
    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_cost_items') as ok"
  );
  const ok = r.rows[0]?.ok === true;
  console.log(ok ? "OK" : "FAIL");
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.log("FAIL");
  process.exit(1);
} finally {
  await client.end();
}
