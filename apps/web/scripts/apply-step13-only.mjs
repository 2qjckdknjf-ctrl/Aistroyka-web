#!/usr/bin/env node
/**
 * Apply ONLY 20260307500000_project_cost_items.sql to target DB.
 * Uses SUPABASE_DB_URL from process.env. No secrets in output.
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(__dirname, "../supabase/migrations/20260307500000_project_cost_items.sql");

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("SUPABASE_DB_URL not set");
  process.exit(1);
}

if (!fs.existsSync(migrationPath)) {
  console.error("Migration file not found");
  process.exit(1);
}

const sql = fs.readFileSync(migrationPath, "utf8");
const client = new pg.Client({ connectionString: dbUrl });

try {
  await client.connect();
  await client.query(sql);
  console.log("OK");
  process.exit(0);
} catch (e) {
  console.error("FAIL:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
