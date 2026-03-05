# Aistroyka — Enterprise Zero-Trust Implementation

**Role:** Principal Architect, Security Lead, AI Platform Engineer  
**Format:** Full SQL, git diff, file lists, schema checks, risks, performance. No theory.

---

## SECTION 1 — RLS ENTERPRISE FINALIZATION (P0)

### 1.1 Tables: tenant_id / project_id / media→project / snapshot→summary→feedback

| Table | tenant_id | project_id | Link | Current RLS | Permissive? |
|-------|-----------|------------|------|-------------|-------------|
| media | ✓ | ✓ | direct | "Allow all for media" | Yes |
| ai_analysis | ✓ | via media_id | media | "Allow all for ai_analysis" | Yes |
| analysis_jobs | ✓ | via media_id | media | "Allow all for analysis_jobs" | Yes |
| tenants | — | — | — | "Allow all for tenants" | Yes |
| tenant_members | ✓ | — | — | "Allow all for tenant_members" | Yes |
| tenant_invitations | ✓ | — | — | "Allow all for tenant_invitations" | Yes |
| milestones | — | ✓ | direct | "Allow all for milestones" | Yes |
| tasks | — | ✓ | direct | "Allow all for tasks" | Yes |
| contractors | ✓ | — | — | "Allow all for contractors" | Yes |
| contractor_contracts | — | ✓ | direct | "Allow all for contractor_contracts" | Yes |
| contractor_performance | — | ✓ | direct | "Allow all for contractor_performance" | Yes |
| recommendations | ✓ | ✓ | direct | "Allow all for recommendations" | Yes |
| recommendation_feedback | — | — | recommendation_id→r.project_id | "Allow all for recommendation_feedback" | Yes |
| ai_insight_snapshots | ✓ | ✓ | direct | (no policy) | N/A → restrictive in migration |
| ai_llm_summaries | — | — | snapshot_id→snapshots | (no policy) | N/A → restrictive |
| ai_user_feedback | — | project_id | summary_id→summaries | (no policy) | N/A → restrictive |
| ai_insight_evolution_events | ✓ | ✓ | direct | (no policy) | N/A → restrictive |
| ai_insight_rollups_weekly | ✓ | ✓ | direct | (no policy) | N/A → restrictive |
| ai_embeddings | — | — | — | (created in 20260302140000 with RLS) | No |

**ai_embeddings:** created in Section 6 migration with RLS from start.

### 1.2 tenant_members.role

- **Exists:** Yes. Column `role text not null check (role in ('owner', 'admin', 'member', 'viewer'))`.  
  Source: `20250226200000_tenant_members_and_invitations.sql` line 9.
- **No migration needed.** Owner-only policies in 20260302120000 use `tm.role = 'owner'`.

### 1.3 Final migration file

**Path:** `engine/Aistroyk/supabase/migrations/20260302120000_rls_enterprise_final.sql`  
**Status:** Created. Contains: drop policy if exists for all permissive; create restrictive policies; enable RLS where missing. No `using (true)`.

### 1.4 Indexes

In same migration (top of file):

```sql
create index if not exists idx_media_project_id on public.media(project_id);
create index if not exists idx_ai_analysis_media_id on public.ai_analysis(media_id);
create index if not exists idx_analysis_jobs_media_id on public.analysis_jobs(media_id);
create index if not exists idx_tenant_members_user_id on public.tenant_members(user_id);
```

**ai_embeddings:** `idx_ai_embeddings_project_id` in 20260302140000_rag_embeddings.sql.

### 1.5 Tables still permissive (tenant/project domain)

**After applying 20260302120000:** 0. All tenant/project tables above have restrictive policies.

**Not in scope (remain permissive):** regions, region_capacity, job_events, workers, worker_heartbeat, system_capacity, pricing_rules, ai_cost_events, payments, plans, billing_snapshots, usage_events — system/ops tables; can be tightened later.

---

## SECTION 2 — EDGE SECURITY REFACTOR (P0)

### 2.1 SUPABASE_SERVICE_ROLE_KEY usage

| Location | Purpose | Replace with user JWT? |
|----------|--------|------------------------|
| `engine/Aistroyk/supabase/functions/aistroyka-ai-memory/index.ts:576` | Single client for all actions | **Partially.** Tenant/project actions → user JWT. System-only → keep service role + x-cron-secret. |
| `engine/Aistroyk/supabase/functions/aistroyka-llm-copilot/index.ts:282` | Read ai_llm_logs (cost check), insert ai_llm_logs | **No.** Audit table; no tenant data in request. Service role acceptable. |
| `engine/Aistroyk/supabase/functions/stripe-webhook/index.ts:55` | Payments/billing writes | **No.** Webhook has no user JWT. |
| `apps/web/lib/supabase/admin.ts` | getAdminClient() | **No.** Bucket create only. |
| `apps/web/app/api/projects/[id]/upload/route.ts` | createBucket | **No.** Same. |
| `apps/web/scripts/seed-supabase-media.mjs` | Seed script | **No.** Ops. |

### 2.2 Refactor: unified diff aistroyka-ai-memory

**Actions:**

- **A) Tenant/project scoped (require Authorization):** write_snapshot, write_llm_summary, fetch_context_window, write_feedback, list_timeline, list_evolution, list_portfolio, list_org_daily, list_black_swan, ack_black_swan, acknowledge_governance_event, get_incident_center, incident_acknowledge, incident_resolve, incident_add_note, fetch_budget_metrics, fetch_schedule_metrics, fetch_contractor_metrics, write_recommendation_feedback.
- **B) System-only (require x-cron-secret):** run_weekly_rollups, run_health_metrics_daily, trust_aggregate_daily, org_aggregate_daily.

**Diff (replace block from line 559 to 596 and add requestId + client choice after body parse):**

```diff
--- a/engine/Aistroyk/supabase/functions/aistroyka-ai-memory/index.ts
+++ b/engine/Aistroyk/supabase/functions/aistroyka-ai-memory/index.ts
@@ -556,6 +556,7 @@ function rateLimit(key: string): boolean {
 }

 Deno.serve(async (req: Request) => {
+  const requestId = crypto.randomUUID()
   if (req.method !== "POST") {
     return new Response(JSON.stringify({ error: "method_not_allowed", message: "POST only" }), {
       status: 405,
@@ -572,10 +573,35 @@ Deno.serve(async (req: Request) => {
   }

   const supabaseUrl = Deno.env.get("SUPABASE_URL")!
   const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
   const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
-  const supabase = createClient(supabaseUrl, supabaseServiceKey)
+  const SYSTEM_ONLY_ACTIONS = new Set([
+    "run_weekly_rollups", "run_health_metrics_daily", "trust_aggregate_daily", "org_aggregate_daily"
+  ])
+  const authHeader = req.headers.get("Authorization")
+  const cronSecret = req.headers.get("x-cron-secret")
+  const isSystemAction = SYSTEM_ONLY_ACTIONS.has(action)
+  const useUserClient = !isSystemAction && !!authHeader && !!supabaseAnonKey
+  let supabase: ReturnType<typeof createClient>
+  if (isSystemAction) {
+    if (cronSecret !== Deno.env.get("CRON_SECRET")) {
+      return new Response(JSON.stringify({ error: "forbidden", message: "System action requires x-cron-secret" }), { status: 403, headers: { "Content-Type": "application/json" } })
+    }
+    supabase = createClient(supabaseUrl, supabaseServiceKey)
+  } else {
+    if (!authHeader || !supabaseAnonKey) {
+      return new Response(JSON.stringify({ error: "unauthorized", message: "Authorization header and SUPABASE_ANON_KEY required" }), { status: 401, headers: { "Content-Type": "application/json" } })
+    }
+    supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })
+  }
 
   let body: { action: string; [key: string]: unknown }
   try {
@@ -588,6 +614,7 @@ Deno.serve(async (req: Request) => {
   const action = body.action
   if (!action || typeof action !== "string") {
     return new Response(JSON.stringify({ error: "missing_action", message: "body.action required" }), {
```

**Problem:** `action` is not defined until after `body = await req.json()` and `action = body.action`. So the client choice must come **after** parsing body and reading `action`. Correct order:

1. Parse body, get `action`.
2. Then: if system action → check x-cron-secret, use service client; else require Authorization, use user client.
3. Add requestId at top; at the end of every Response set header `X-Request-Id: requestId`.

**Correct placement:** After `const action = body.action` block (after line 596), insert:

```ts
  const SYSTEM_ONLY_ACTIONS = new Set([
    "run_weekly_rollups", "run_health_metrics_daily", "trust_aggregate_daily", "org_aggregate_daily"
  ])
  const authHeader = req.headers.get("Authorization")
  const cronSecret = req.headers.get("x-cron-secret")
  const isSystemAction = SYSTEM_ONLY_ACTIONS.has(action)
  const useUserClient = !isSystemAction && !!authHeader && !!supabaseAnonKey
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
  let supabase: ReturnType<typeof createClient>
  if (isSystemAction) {
    if (cronSecret !== Deno.env.get("CRON_SECRET")) {
      return new Response(JSON.stringify({ error: "forbidden", message: "System action requires x-cron-secret" }), { status: 403, headers: { "Content-Type": "application/json", "X-Request-Id": requestId } })
    }
    supabase = createClient(supabaseUrl, supabaseServiceKey)
  } else {
    if (!authHeader || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "unauthorized", message: "Authorization header and SUPABASE_ANON_KEY required" }), { status: 401, headers: { "Content-Type": "application/json", "X-Request-Id": requestId } })
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader! } } })
  }
```

And **remove** the earlier block that does `const supabase = createClient(supabaseUrl, supabaseServiceKey)` (lines 574-578) and the later block that builds `userSupabase` only for domain metrics (1947-1953); use the single `supabase` above for all actions. For every `return new Response(...)` in the handler, add to headers: `"X-Request-Id": requestId`. Add at the very top of the handler: `const requestId = crypto.randomUUID()`.

**Endpoints that now require Authorization (Bearer JWT):** All except run_weekly_rollups, run_health_metrics_daily, trust_aggregate_daily, org_aggregate_daily. Those four require `x-cron-secret` instead.

**Files touched:**
- `engine/Aistroyk/supabase/functions/aistroyka-ai-memory/index.ts`

---

## SECTION 3 — PROMPT REGISTRY (P1)

### 3.1 Migration 20260302130000_ai_prompts_registry.sql

**Path:** `engine/Aistroyk/supabase/migrations/20260302130000_ai_prompts_registry.sql`  
**Status:** Created. Contents: table ai_prompts (id, name, version, template, model, temperature, top_p, max_tokens, schema_name, active, created_at, updated_at); unique(name, version); index(name, active) where active = true.

### 3.2 ai_llm_logs columns

In same migration: request_id text; tenant_id uuid; project_id uuid; prompt_id uuid references ai_prompts(id); fallback_reason text; error_category text. Indexes: (tenant_id, created_at desc), (mode, created_at desc).

### 3.3 aistroyka-llm-copilot diff (prompt load, cache, log prompt_id/request_id)

- Add at top: `const requestId = crypto.randomUUID()` in handler; set response header `X-Request-Id: requestId`.
- After creating supabase client: load active prompt:

```ts
const PROMPT_NAME = "copilot_executive_summary"
let promptRow: { id: string; template: string; model: string; temperature: number; top_p: number; max_tokens: number; version: string } | null = null
const { data: promptData } = await supabase.from("ai_prompts").select("id, template, model, temperature, top_p, max_tokens, version").eq("name", PROMPT_NAME).eq("active", true).limit(1).maybeSingle()
if (promptData) promptRow = promptData as typeof promptRow
const systemPrompt = promptRow?.template ?? `You are a construction intelligence assistant...` // fallback inline
const model = promptRow?.model ?? MODEL_DEFAULT
const temperature = promptRow?.temperature ?? 0.3
const top_p = promptRow?.top_p ?? 1
const max_tokens = promptRow?.max_tokens ?? 600
```

- In openai.chat.completions.create: use model, temperature, top_p, max_tokens from promptRow or defaults.
- In ai_llm_logs insert: add request_id: requestId, tenant_id: body.tenant_id ?? null, project_id: body.project_id ?? null, prompt_id: promptRow?.id ?? null, fallback_reason: responsePayload.fallback_used ? (modelVersion ?? null) : null, error_category: responsePayload.fallback_used ? (modelVersion ?? "unknown") : null.

**Full diff (skeleton):** Request body may include tenant_id, project_id (optional). Handler start: requestId = crypto.randomUUID(). After supabase client: query ai_prompts for name PROMPT_NAME and active=true; set promptRow; systemPrompt = promptRow?.template ?? DEFAULT_SYSTEM_PROMPT; model/temperature/top_p/max_tokens from promptRow or defaults. completion.create({ model, temperature, top_p, max_tokens, ... }). Log insert: request_id, tenant_id, project_id, prompt_id, fallback_reason, error_category. Response headers: X-Request-Id: requestId.

---

## SECTION 4 — STRUCTURED OUTPUT GUARD

**File:** `engine/Aistroyk/supabase/functions/_shared/llmGuard.ts`  
**Status:** Created. Exports: MAX_RETRIES, ErrorCategory, classifyError, SchemaResult, ValidateResult, GuardOptions, withStructuredOutputGuard.

**Error categories:** invalid_json, schema_violation, validation_failed, timeout, rate_limit, budget_exceeded, user_limit_exceeded, unknown.

**Integration in Copilot:** In handler, wrap the LLM call and response parse in withStructuredOutputGuard: parse = (content) => JSON.parse(content.replace(/^```json\s*|\s*```$/g, "").trim()), schema = (raw) => check StrictOutput shape, validate = (data) => validateOutput(data, allowedNumbers, MAX_TEXT_LENGTH). On success use data; on failure use fallback and set error_category from result.category. Log to ai_llm_logs with error_category.

---

## SECTION 5 — LLM EVAL PIPELINE (P1)

**Structure:**  
`engine/Aistroyk/ai-eval/datasets/executive_summary_fixture.json`  
`engine/Aistroyk/ai-eval/golden/executive_summary_constraints.json`  
`engine/Aistroyk/ai-eval/runner.ts`

**Tests:** (1) executive_summary shape + tone in allowed list; (2) no-new-numbers (hallucination); (3) requiredKeys present (schema).

**runner.ts:** Exit 1 on assertion failure; metrics hallucination_rate, schema_violation_rate. **Status:** Created.

**GitHub Actions:** `.github/workflows/ai-eval.yml` — on push/PR to paths: aistroyka-llm-copilot/**; _shared/**; ai-eval/**; migrations *prompts* / *ai_prompts*. Run from engine/Aistroyk: npx tsx ai-eval/runner.ts. Fail pipeline on non-zero exit.

---

## SECTION 6 — RAG v1 (P2)

### 6.1 Migration 20260302140000_rag_embeddings.sql

**Path:** `engine/Aistroyk/supabase/migrations/20260302140000_rag_embeddings.sql`  
**Status:** Created. extension vector; table ai_embeddings (id, tenant_id, project_id, source_type, source_id, chunk_index, chunk, embedding vector(1536), created_at); ivfflat index lists=100; RLS via project_members.

### 6.2 RPC match_ai_embeddings

In same migration: security definer; checks project_members for p_project_id and auth.uid(); returns rows where embedding <=> p_embedding < p_threshold order by distance limit p_limit.

### 6.3 Edge action search_context

In aistroyka-ai-memory (or new function): action === "search_context" → require user JWT (same as other tenant actions); body.project_id, body.query_embedding (array 1536); call userSupabase.rpc("match_ai_embeddings", { p_project_id, p_embedding: query_embedding, p_limit: 10, p_threshold: 0.3 }); return { chunks: data }.

### 6.4 Ingestion pipeline

- **When:** On write of source entities (e.g. milestone/task/recommendation created or updated) or via scheduled job over recent snapshot_summary.
- **Who:** Backend/Edge with service role or trusted job that has project_id; generates embedding via OpenAI embeddings API (e.g. text-embedding-3-small 1536); inserts into ai_embeddings with project_id/tenant_id/source_type/source_id/chunk_index/chunk/embedding.
- **Updates:** On source update or delete, delete from ai_embeddings where (project_id, source_type, source_id) then re-insert new chunks.

---

## SECTION 7 — OBSERVABILITY UPGRADE

- **request_id:** Set at Edge entry (crypto.randomUUID()); pass to all logs; response header X-Request-Id.
- **Structured log schema (ai_llm_logs):** id, created_at, request_id, user_id, tenant_id, project_id, mode, tokens_used, latency_ms, cached, validation_passed, fallback_used, fallback_reason, error_category, context_version, prompt_version, prompt_id, model_version.
- **Insert example:** See Section 3.3; include request_id, tenant_id, project_id, prompt_id, fallback_reason, error_category.
- **Error taxonomy:** Enum in app: invalid_json, schema_violation, validation_failed, timeout, rate_limit, budget_exceeded, user_limit_exceeded, no_api_key, unknown. Stored in error_category (or model_version for backward compat).
- **Middleware example:** First line of Deno.serve handler: const requestId = crypto.randomUUID(); before return new Response(..., { headers: { ...headers, "X-Request-Id": requestId } }).

---

## SECTION 8 — PERFORMANCE & RISK REVIEW

### RLS

- **Join cost:** Each policy uses exists (select 1 from project_members pm where pm.project_id = X and pm.user_id = auth.uid()). Index idx_project_members_user_id, idx_project_members_project_id — good for nested loop.
- **media/ai_analysis/analysis_jobs:** Policy joins media → project_members. idx_media_project_id used; ai_analysis and analysis_jobs use media_id → media then project_id; idx_ai_analysis_media_id, idx_analysis_jobs_media_id added. Risk: seq scan on project_members if user_id not selective; typically one user has few projects — low.
- **ai_llm_summaries:** Policy joins ai_insight_snapshots then project_members/tenant_members. Indexes on snapshot_id (existing), project_id/tenant_id on snapshots — ok. Possible seq scan on snapshots for large limit; cap limit in app.
- **recommendation_feedback:** Join recommendations → project_members. idx_recommendation_feedback_recommendation; recommendations.project_id indexed — ok.
- **Additional indexes:** If heavy list_timeline by project_id, ensure ai_insight_snapshots(project_id, created_at desc) — already exists (idx_ai_insight_snapshots_project_created).

### Edge

- **Latency:** User client adds one JWT verification per request (Supabase validates JWT). Negligible. No extra network hop.
- **Concurrency:** Single client per request; no shared mutable state. Rate limit is in-memory (per worker); under multi-instance may be per-instance.

---

## SECTION 9 — ENTERPRISE READINESS MATRIX

| Layer | Current | After | Gap | Priority |
|-------|---------|-------|-----|----------|
| RLS | Permissive on tenant/project tables | Restrictive on all listed | None for domain tables | P0 |
| Edge security | Service role for all ai-memory | User JWT for tenant actions; cron secret for system | Apply diff | P0 |
| Prompt registry | Inline prompts | ai_prompts + load in Copilot | Seed row; Copilot diff | P1 |
| Observability | ai_llm_logs basic | request_id, tenant_id, project_id, prompt_id, fallback_reason, error_category | Migration + Copilot insert | P1 |
| Eval | None | runner + golden + CI | Run in CI; path filter | P1 |
| RAG | None | ai_embeddings + match_ai_embeddings + search_context | Ingestion pipeline | P2 |
| Structured guard | Inline validation | llmGuard.ts + integrate | Use in Copilot | P1 |

---

## SECTION 10 — 30 DAY EXECUTION PLAN

**Week 1 — Security lockdown**  
- Apply 20260302120000_rls_enterprise_final.sql in staging; run RLS tests.  
- Apply Edge refactor (Section 2): requestId, SYSTEM_ONLY_ACTIONS, user client vs service + x-cron-secret; remove duplicate userSupabase block; set CRON_SECRET in secrets.  
- Deploy ai-memory; verify tenant actions require Authorization and system actions require x-cron-secret.

**Week 2 — Governance**  
- Apply 20260302130000_ai_prompts_registry.sql; seed one row (name=copilot_executive_summary, version=1, active=true, template=current inline).  
- Update aistroyka-llm-copilot: load active prompt; use temperature/top_p/max_tokens; log request_id, prompt_id, tenant_id, project_id, fallback_reason, error_category; X-Request-Id header.  
- Integrate _shared/llmGuard.ts in Copilot (withStructuredOutputGuard); log error_category on failure.

**Week 3 — Eval**  
- Add engine/Aistroyk/package.json if missing (for tsx); run ai-eval/runner.ts locally with EDGE_COPILOT_URL.  
- Enable .github/workflows/ai-eval.yml; set EDGE_COPILOT_URL (and OPENAI_API_KEY if needed) in repo secrets.  
- Fix path filter if repo layout differs; ensure pipeline fails on regression.

**Week 4 — RAG**  
- Apply 20260302140000_rag_embeddings.sql.  
- Implement Edge action search_context (user JWT, match_ai_embeddings RPC).  
- Document ingestion: which jobs/writes produce embeddings; run manual or cron for pilot.

---

## FILES TOUCHED (SUMMARY)

| File | Change |
|------|--------|
| engine/Aistroyk/supabase/migrations/20260302120000_rls_enterprise_final.sql | New |
| engine/Aistroyk/supabase/migrations/20260302130000_ai_prompts_registry.sql | New |
| engine/Aistroyk/supabase/migrations/20260302140000_rag_embeddings.sql | New |
| engine/Aistroyk/supabase/functions/_shared/llmGuard.ts | New |
| engine/Aistroyk/supabase/functions/aistroyka-ai-memory/index.ts | Refactor client + requestId + X-Request-Id |
| engine/Aistroyk/supabase/functions/aistroyka-llm-copilot/index.ts | Prompt registry load; ai_llm_logs cols; optional llmGuard |
| engine/Aistroyk/ai-eval/datasets/executive_summary_fixture.json | New |
| engine/Aistroyk/ai-eval/golden/executive_summary_constraints.json | New |
| engine/Aistroyk/ai-eval/runner.ts | New |
| .github/workflows/ai-eval.yml | New |

---

## SCHEMA COMPATIBILITY

- **20260302120000:** Drops only permissive policies and creates new ones; no column changes. Safe if project_members and tenant_members populated (backfill in 20260301120000).
- **20260302130000:** Adds table ai_prompts; adds columns to ai_llm_logs (all nullable or with default). Backward compatible.
- **20260302140000:** Creates extension vector and table ai_embeddings. New; no impact on existing tables.

---

## RISKS

1. **RLS too strict:** Tenant members who had access only via old permissive policies might lose access if not in project_members. Mitigation: 20260301120000 backfilled project_members from tenant_members; new projects get creator via trigger.
2. **Edge 401 for clients:** Clients that do not send Authorization for ai-memory will get 401 after refactor. Mitigation: Ensure iOS/Web send Bearer token for all ai-memory calls.
3. **Cron jobs:** run_weekly_rollups etc. must send x-cron-secret. Mitigation: Set CRON_SECRET in Edge secrets; update cron caller (e.g. Supabase cron or external) to send header.
4. **Prompt registry empty:** If no active row, Copilot uses inline fallback; no break.
5. **Eval flakiness:** LLM output may vary; golden “no new numbers” might occasionally fail. Mitigation: Run multiple times or allow retry in CI; or relax to “tone and keys present” only for CI.

---

## PERFORMANCE NOTES

- **RLS:** Indexes on (project_id, user_id) for project_members and (tenant_id, user_id) for tenant_members are critical; present in 20260301120000 and 20260302120000.
- **ai_embeddings ivfflat:** lists=100 is for ~10k–100k rows; if much larger, increase lists (e.g. sqrt(rows) or more).
- **match_ai_embeddings:** Runs as definer; single index scan on (project_id, embedding <=> p_embedding). Limit 10 keeps cost low.
