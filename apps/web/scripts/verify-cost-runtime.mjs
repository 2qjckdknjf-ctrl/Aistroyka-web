#!/usr/bin/env node
/**
 * Step 13 runtime verification: cost API under authenticated context.
 * Requires: STEP13_VERIFY_EMAIL, STEP13_VERIFY_PASSWORD, BASE_URL (default http://localhost:3000)
 * Optional: STEP13_VERIFY_PROJECT_ID (if omitted, script picks first project from /api/v1/projects)
 * Do not commit credentials. Run: BASE_URL=http://localhost:3000 STEP13_VERIFY_EMAIL=... STEP13_VERIFY_PASSWORD=... node scripts/verify-cost-runtime.mjs
 */
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.STEP13_VERIFY_EMAIL;
const PASSWORD = process.env.STEP13_VERIFY_PASSWORD;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const PROJECT_ID = process.env.STEP13_VERIFY_PROJECT_ID?.trim() || null;

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error("Set STEP13_VERIFY_EMAIL and STEP13_VERIFY_PASSWORD (tenant member credentials).");
    process.exit(1);
  }
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authErr || !auth?.session?.access_token) {
    console.error("Auth failed:", authErr?.message ?? "No session");
    process.exit(1);
  }

  const token = auth.session.access_token;
  const headers = { Authorization: `Bearer ${token}` };

  const resolvedProjectId = await resolveProjectId(headers);
  console.log("Using project:", resolvedProjectId);

  // GET costs
  const getRes = await fetch(`${BASE_URL}/api/v1/projects/${resolvedProjectId}/costs`, { headers });
  if (!getRes.ok) {
    console.error("GET costs failed:", getRes.status, await getRes.text());
    process.exit(1);
  }
  const getJson = await getRes.json();
  const items = getJson?.data?.items ?? [];
  const summary = getJson?.data?.summary ?? {};
  console.log("GET costs OK:", { itemCount: items.length, planned_total: summary.planned_total, actual_total: summary.actual_total });

  // POST create
  const createRes = await fetch(`${BASE_URL}/api/v1/projects/${resolvedProjectId}/costs`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ category: "other", title: "Runtime verification test", planned_amount: 100 }),
  });
  if (!createRes.ok) {
    console.error("POST create failed:", createRes.status, await createRes.text());
    process.exit(1);
  }
  const createJson = await createRes.json();
  const createdId = createJson?.data?.id;
  if (!createdId) {
    console.error("Create response missing id");
    process.exit(1);
  }
  console.log("POST create OK:", createdId);

  // PATCH update
  const patchRes = await fetch(`${BASE_URL}/api/v1/projects/${resolvedProjectId}/costs/${createdId}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ actual_amount: 50 }),
  });
  if (!patchRes.ok) {
    console.error("PATCH update failed:", patchRes.status, await patchRes.text());
    process.exit(1);
  }
  console.log("PATCH update OK");

  // GET again to verify summary refresh
  const getRes2 = await fetch(`${BASE_URL}/api/v1/projects/${resolvedProjectId}/costs`, { headers });
  if (!getRes2.ok) {
    console.error("GET costs (2) failed:", getRes2.status);
    process.exit(1);
  }
  const getJson2 = await getRes2.json();
  const summary2 = getJson2?.data?.summary ?? {};
  console.log("GET costs (2) OK:", { planned_total: summary2.planned_total, actual_total: summary2.actual_total });

  console.log("SUCCESS: Step 13 cost API runtime verified.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

async function resolveProjectId(headers) {
  if (PROJECT_ID) return PROJECT_ID;

  const projectsRes = await fetch(`${BASE_URL}/api/v1/projects`, { headers });
  if (!projectsRes.ok) {
    throw new Error(`GET projects failed: ${projectsRes.status} ${await projectsRes.text()}`);
  }
  const projectsJson = await projectsRes.json();
  const projects = projectsJson?.data ?? [];
  if (!Array.isArray(projects) || projects.length === 0 || !projects[0]?.id) {
    throw new Error("No projects available for authenticated user; set STEP13_VERIFY_PROJECT_ID explicitly.");
  }
  return projects[0].id;
}
