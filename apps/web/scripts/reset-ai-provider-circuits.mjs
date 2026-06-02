#!/usr/bin/env node
/**
 * Reset ai_provider_health circuit breakers (open → closed).
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or repo admin env).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!url || !key) {
  console.error("BLOCKED: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await supabase
  .from("ai_provider_health")
  .update({ state: "closed", failure_count: 0, last_failure_at: null, updated_at: new Date().toISOString() })
  .in("provider", ["openai", "anthropic", "gemini"])
  .select("provider, state, failure_count");

if (error) {
  console.error("FAIL:", error.message);
  process.exit(1);
}
console.log("OK: reset ai_provider_health", data);
