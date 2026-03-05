# Aistroyka — Enterprise-Grade Zero-Trust Multi-Tenant AI Platform Plan

**Role:** Principal Architect / Security Lead  
**Date:** 2026-03-01  
**Format:** SQL, code patches, file references. Production-grade.

---

## 1. SECURITY COMPLETION (RLS FINALIZATION)

### 1.1 Tables with tenant_id / project_id / media→project→tenant

| Table | tenant_id | project_id | Link | Current RLS | Source |
|-------|-----------|------------|------|-------------|--------|
| **media** | ✓ (NOT NULL) | ✓ | direct | **Permissive** `using (true)` | 20250222100000, 20250223300000 |
| **ai_analysis** | ✓ (NOT NULL) | via media_id→media.project_id | media | **Permissive** | 20250222100000, 20250223300000 |
| **analysis_jobs** | ✓ (NOT NULL) | via media_id→media.project_id | media | **Permissive** | 20250222300000, 20250223300000 |
| **tenants** | — | — | — | **Permissive** | 20250223300000 |
| **tenant_members** | ✓ | — | — | **Permissive** | 20250226200000 |
| **tenant_invitations** | ✓ | — | — | **Permissive** | 20250226200000 |
| **milestones** | — | ✓ | direct | **Permissive** | 20250228210000 |
| **tasks** | — | ✓ | direct | **Permissive** | 20250228210000 |
| **contractors** | ✓ | — | — | **Permissive** | 20250228210000 |
| **contractor_contracts** | — | ✓ | direct | **Permissive** | 20250228210000 |
| **contractor_performance** | — | ✓ | direct | **Permissive** | 20250228210000 |
| **recommendations** | ✓ | ✓ | direct | **Permissive** | 20250228210000 |
| **recommendation_feedback** | — | — | recommendation_id | **Permissive** | 20250228210000 |
| **ai_insight_snapshots** | ✓ | ✓ | direct | (no policy in migrations; RLS may be off) | 20250228110000 |
| **ai_llm_summaries** | — | — | snapshot_id→snapshots | (no RLS in migration) | 20250228110000 |
| **ai_user_feedback** | — | project_id | summary_id→summaries | (no RLS) | 20250228110000 |
| **ai_insight_evolution_events** | ✓ | ✓ | direct | (no RLS) | 20250228120000 |
| **ai_insight_rollups_weekly** | ✓ | ✓ | direct | (no RLS) | 20250228120000 |

**Already hardened (20260301120000):** projects, project_budget, cost_items, commitments, project_members.

### 1.2 Production RLS model

- **Tenant isolation:** user must be in `tenant_members` for that `tenant_id`.
- **Project isolation:** user must be in `project_members` for that `project_id`.
- **INSERT:** allowed if user is in tenant (for tenant-scoped) or in project_members (for project-scoped).
- **SELECT/UPDATE/DELETE:** only rows where user has access via project_members (or tenant_members for tenant-only tables).

### 1.3 Ready SQL migration

File: `engine/Aistroyk/supabase/migrations/20260302120000_rls_enterprise_final.sql`

```sql
-- RLS Enterprise Final: media, ai_analysis, analysis_jobs, tenants, tenant_members,
-- tenant_invitations, milestones, tasks, contractors, contractor_*, recommendations,
-- recommendation_feedback, ai_insight_snapshots, ai_llm_summaries, ai_user_feedback,
-- ai_insight_evolution_events, ai_insight_rollups_weekly.
-- Model: project_members for project_id; tenant_members for tenant_id.

-- ---------- MEDIA (project-scoped) ----------
alter table public.media enable row level security;
drop policy if exists "Allow all for media" on public.media;
create policy "media_select_member" on public.media for select
  using (exists (select 1 from public.project_members pm where pm.project_id = media.project_id and pm.user_id = auth.uid()));
create policy "media_insert_member" on public.media for insert
  with check (exists (select 1 from public.project_members pm where pm.project_id = media.project_id and pm.user_id = auth.uid()));
create policy "media_update_member" on public.media for update
  using (exists (select 1 from public.project_members pm where pm.project_id = media.project_id and pm.user_id = auth.uid()));
create policy "media_delete_member" on public.media for delete
  using (exists (select 1 from public.project_members pm where pm.project_id = media.project_id and pm.user_id = auth.uid()));

-- ---------- AI_ANALYSIS (project via media) ----------
alter table public.ai_analysis enable row level security;
drop policy if exists "Allow all for ai_analysis" on public.ai_analysis;
create policy "ai_analysis_select" on public.ai_analysis for select
  using (exists (
    select 1 from public.media m
    inner join public.project_members pm on pm.project_id = m.project_id and pm.user_id = auth.uid()
    where m.id = ai_analysis.media_id
  ));
create policy "ai_analysis_insert" on public.ai_analysis for insert
  with check (exists (
    select 1 from public.media m
    inner join public.project_members pm on pm.project_id = m.project_id and pm.user_id = auth.uid()
    where m.id = ai_analysis.media_id
  ));
create policy "ai_analysis_update" on public.ai_analysis for update
  using (exists (
    select 1 from public.media m
    inner join public.project_members pm on pm.project_id = m.project_id and pm.user_id = auth.uid()
    where m.id = ai_analysis.media_id
  ));
create policy "ai_analysis_delete" on public.ai_analysis for delete
  using (exists (
    select 1 from public.media m
    inner join public.project_members pm on pm.project_id = m.project_id and pm.user_id = auth.uid()
    where m.id = ai_analysis.media_id
  ));

-- ---------- ANALYSIS_JOBS (project via media) ----------
alter table public.analysis_jobs enable row level security;
drop policy if exists "Allow all for analysis_jobs" on public.analysis_jobs;
create policy "analysis_jobs_select" on public.analysis_jobs for select
  using (exists (
    select 1 from public.media m
    inner join public.project_members pm on pm.project_id = m.project_id and pm.user_id = auth.uid()
    where m.id = analysis_jobs.media_id
  ));
create policy "analysis_jobs_insert" on public.analysis_jobs for insert
  with check (exists (
    select 1 from public.media m
    inner join public.project_members pm on pm.project_id = m.project_id and pm.user_id = auth.uid()
    where m.id = analysis_jobs.media_id
  ));
create policy "analysis_jobs_update" on public.analysis_jobs for update
  using (exists (
    select 1 from public.media m
    inner join public.project_members pm on pm.project_id = m.project_id and pm.user_id = auth.uid()
    where m.id = analysis_jobs.media_id
  ));
create policy "analysis_jobs_delete" on public.analysis_jobs for delete
  using (exists (
    select 1 from public.media m
    inner join public.project_members pm on pm.project_id = m.project_id and pm.user_id = auth.uid()
    where m.id = analysis_jobs.media_id
  ));

-- ---------- TENANTS (SELECT only for members; INSERT/UPDATE/DELETE = service only, no user policy) ----------
drop policy if exists "Allow all for tenants" on public.tenants;
create policy "tenants_select_member" on public.tenants for select
  using (exists (select 1 from public.tenant_members tm where tm.tenant_id = tenants.id and tm.user_id = auth.uid()));

-- ---------- TENANT_MEMBERS ----------
drop policy if exists "Allow all for tenant_members" on public.tenant_members;
create policy "tenant_members_select_own_tenant" on public.tenant_members for select
  using (auth.uid() = user_id or exists (select 1 from public.tenant_members tm2 where tm2.tenant_id = tenant_members.tenant_id and tm2.user_id = auth.uid()));
create policy "tenant_members_insert_owner" on public.tenant_members for insert
  with check (exists (select 1 from public.tenant_members tm where tm.tenant_id = tenant_members.tenant_id and tm.user_id = auth.uid() and tm.role = 'owner'));
create policy "tenant_members_update_owner" on public.tenant_members for update
  using (exists (select 1 from public.tenant_members tm where tm.tenant_id = tenant_members.tenant_id and tm.user_id = auth.uid() and tm.role = 'owner'));
create policy "tenant_members_delete_owner_or_self" on public.tenant_members for delete
  using (auth.uid() = user_id or exists (select 1 from public.tenant_members tm where tm.tenant_id = tenant_members.tenant_id and tm.user_id = auth.uid() and tm.role = 'owner'));

-- ---------- TENANT_INVITATIONS ----------
drop policy if exists "Allow all for tenant_invitations" on public.tenant_invitations;
create policy "tenant_invitations_select_member" on public.tenant_invitations for select
  using (exists (select 1 from public.tenant_members tm where tm.tenant_id = tenant_invitations.tenant_id and tm.user_id = auth.uid()));
create policy "tenant_invitations_insert_member" on public.tenant_invitations for insert
  with check (exists (select 1 from public.tenant_members tm where tm.tenant_id = tenant_invitations.tenant_id and tm.user_id = auth.uid()));
create policy "tenant_invitations_update_member" on public.tenant_invitations for update
  using (exists (select 1 from public.tenant_members tm where tm.tenant_id = tenant_invitations.tenant_id and tm.user_id = auth.uid()));
create policy "tenant_invitations_delete_member" on public.tenant_invitations for delete
  using (exists (select 1 from public.tenant_members tm where tm.tenant_id = tenant_invitations.tenant_id and tm.user_id = auth.uid()));

-- ---------- MILESTONES, TASKS (project-scoped) ----------
drop policy if exists "Allow all for milestones" on public.milestones;
create policy "milestones_all_member" on public.milestones for all
  using (exists (select 1 from public.project_members pm where pm.project_id = milestones.project_id and pm.user_id = auth.uid()))
  with check (exists (select 1 from public.project_members pm where pm.project_id = milestones.project_id and pm.user_id = auth.uid()));

drop policy if exists "Allow all for tasks" on public.tasks;
create policy "tasks_all_member" on public.tasks for all
  using (exists (select 1 from public.project_members pm where pm.project_id = tasks.project_id and pm.user_id = auth.uid()))
  with check (exists (select 1 from public.project_members pm where pm.project_id = tasks.project_id and pm.user_id = auth.uid()));

-- ---------- CONTRACTORS (tenant-scoped) ----------
drop policy if exists "Allow all for contractors" on public.contractors;
create policy "contractors_all_tenant" on public.contractors for all
  using (exists (select 1 from public.tenant_members tm where tm.tenant_id = contractors.tenant_id and tm.user_id = auth.uid()))
  with check (exists (select 1 from public.tenant_members tm where tm.tenant_id = contractors.tenant_id and tm.user_id = auth.uid()));

drop policy if exists "Allow all for contractor_contracts" on public.contractor_contracts;
create policy "contractor_contracts_all_member" on public.contractor_contracts for all
  using (exists (select 1 from public.project_members pm where pm.project_id = contractor_contracts.project_id and pm.user_id = auth.uid()))
  with check (exists (select 1 from public.project_members pm where pm.project_id = contractor_contracts.project_id and pm.user_id = auth.uid()));

drop policy if exists "Allow all for contractor_performance" on public.contractor_performance;
create policy "contractor_performance_all_member" on public.contractor_performance for all
  using (exists (select 1 from public.project_members pm where pm.project_id = contractor_performance.project_id and pm.user_id = auth.uid()))
  with check (exists (select 1 from public.project_members pm where pm.project_id = contractor_performance.project_id and pm.user_id = auth.uid()));

-- ---------- RECOMMENDATIONS (project + tenant) ----------
drop policy if exists "Allow all for recommendations" on public.recommendations;
create policy "recommendations_all_member" on public.recommendations for all
  using (exists (select 1 from public.project_members pm where pm.project_id = recommendations.project_id and pm.user_id = auth.uid()))
  with check (exists (select 1 from public.project_members pm where pm.project_id = recommendations.project_id and pm.user_id = auth.uid()));

-- ---------- RECOMMENDATION_FEEDBACK (via recommendations.project_id) ----------
drop policy if exists "Allow all for recommendation_feedback" on public.recommendation_feedback;
create policy "recommendation_feedback_all" on public.recommendation_feedback for all
  using (exists (
    select 1 from public.recommendations r
    inner join public.project_members pm on pm.project_id = r.project_id and pm.user_id = auth.uid()
    where r.id = recommendation_feedback.recommendation_id
  ))
  with check (exists (
    select 1 from public.recommendations r
    inner join public.project_members pm on pm.project_id = r.project_id and pm.user_id = auth.uid()
    where r.id = recommendation_feedback.recommendation_id
  ));

-- ---------- AI INSIGHT SNAPSHOTS (tenant_id + project_id) ----------
alter table public.ai_insight_snapshots enable row level security;
create policy "ai_insight_snapshots_select" on public.ai_insight_snapshots for select
  using (
    (project_id is not null and exists (select 1 from public.project_members pm where pm.project_id = ai_insight_snapshots.project_id and pm.user_id = auth.uid()))
    or (tenant_id is not null and exists (select 1 from public.tenant_members tm where tm.tenant_id = ai_insight_snapshots.tenant_id and tm.user_id = auth.uid()))
    or (project_id is null and tenant_id is null)
  );
create policy "ai_insight_snapshots_insert" on public.ai_insight_snapshots for insert
  with check (
    (project_id is not null and exists (select 1 from public.project_members pm where pm.project_id = ai_insight_snapshots.project_id and pm.user_id = auth.uid()))
    or (tenant_id is not null and exists (select 1 from public.tenant_members tm where tm.tenant_id = ai_insight_snapshots.tenant_id and tm.user_id = auth.uid()))
  );
create policy "ai_insight_snapshots_update" on public.ai_insight_snapshots for update
  using (
    (project_id is not null and exists (select 1 from public.project_members pm where pm.project_id = ai_insight_snapshots.project_id and pm.user_id = auth.uid()))
    or (tenant_id is not null and exists (select 1 from public.tenant_members tm where tm.tenant_id = ai_insight_snapshots.tenant_id and tm.user_id = auth.uid()))
  );
create policy "ai_insight_snapshots_delete" on public.ai_insight_snapshots for delete
  using (
    (project_id is not null and exists (select 1 from public.project_members pm where pm.project_id = ai_insight_snapshots.project_id and pm.user_id = auth.uid()))
    or (tenant_id is not null and exists (select 1 from public.tenant_members tm where tm.tenant_id = ai_insight_snapshots.tenant_id and tm.user_id = auth.uid()))
  );

-- ---------- AI LLM SUMMARIES (via snapshot → project/tenant) ----------
alter table public.ai_llm_summaries enable row level security;
create policy "ai_llm_summaries_select" on public.ai_llm_summaries for select
  using (exists (
    select 1 from public.ai_insight_snapshots s
    left join public.project_members pm on pm.project_id = s.project_id and pm.user_id = auth.uid()
    left join public.tenant_members tm on tm.tenant_id = s.tenant_id and tm.user_id = auth.uid()
    where s.id = ai_llm_summaries.snapshot_id
      and (pm.project_id is not null or tm.tenant_id is not null or (s.project_id is null and s.tenant_id is null))
  ));
create policy "ai_llm_summaries_insert" on public.ai_llm_summaries for insert
  with check (exists (
    select 1 from public.ai_insight_snapshots s
    inner join public.project_members pm on pm.project_id = s.project_id and pm.user_id = auth.uid()
    where s.id = ai_llm_summaries.snapshot_id
  ) or exists (
    select 1 from public.ai_insight_snapshots s
    inner join public.tenant_members tm on tm.tenant_id = s.tenant_id and tm.user_id = auth.uid()
    where s.id = ai_llm_summaries.snapshot_id
  ));
create policy "ai_llm_summaries_update" on public.ai_llm_summaries for update
  using (exists (
    select 1 from public.ai_insight_snapshots s
    left join public.project_members pm on pm.project_id = s.project_id and pm.user_id = auth.uid()
    left join public.tenant_members tm on tm.tenant_id = s.tenant_id and tm.user_id = auth.uid()
    where s.id = ai_llm_summaries.snapshot_id and (pm.project_id is not null or tm.tenant_id is not null)
  ));
create policy "ai_llm_summaries_delete" on public.ai_llm_summaries for delete
  using (exists (
    select 1 from public.ai_insight_snapshots s
    inner join public.project_members pm on pm.project_id = s.project_id and pm.user_id = auth.uid()
    where s.id = ai_llm_summaries.snapshot_id
  ) or exists (
    select 1 from public.ai_insight_snapshots s
    inner join public.tenant_members tm on tm.tenant_id = s.tenant_id and tm.user_id = auth.uid()
    where s.id = ai_llm_summaries.snapshot_id
  ));

-- ---------- AI USER FEEDBACK (project_id or via summary→snapshot) ----------
alter table public.ai_user_feedback enable row level security;
create policy "ai_user_feedback_all" on public.ai_user_feedback for all
  using (
    (project_id is not null and exists (select 1 from public.project_members pm where pm.project_id = ai_user_feedback.project_id and pm.user_id = auth.uid()))
    or exists (
      select 1 from public.ai_llm_summaries sum
      inner join public.ai_insight_snapshots s on s.id = sum.snapshot_id
      left join public.project_members pm on pm.project_id = s.project_id and pm.user_id = auth.uid()
      left join public.tenant_members tm on tm.tenant_id = s.tenant_id and tm.user_id = auth.uid()
      where sum.id = ai_user_feedback.summary_id and (pm.project_id is not null or tm.tenant_id is not null)
    )
  )
  with check (
    (project_id is not null and exists (select 1 from public.project_members pm where pm.project_id = ai_user_feedback.project_id and pm.user_id = auth.uid()))
    or exists (
      select 1 from public.ai_llm_summaries sum
      inner join public.ai_insight_snapshots s on s.id = sum.snapshot_id
      inner join public.project_members pm on pm.project_id = s.project_id and pm.user_id = auth.uid()
      where sum.id = ai_user_feedback.summary_id
    )
  );

-- ---------- AI INSIGHT EVOLUTION EVENTS ----------
alter table public.ai_insight_evolution_events enable row level security;
create policy "ai_evolution_select" on public.ai_insight_evolution_events for select
  using (
    (project_id is not null and exists (select 1 from public.project_members pm where pm.project_id = ai_insight_evolution_events.project_id and pm.user_id = auth.uid()))
    or (tenant_id is not null and exists (select 1 from public.tenant_members tm where tm.tenant_id = ai_insight_evolution_events.tenant_id and tm.user_id = auth.uid()))
  );
create policy "ai_evolution_insert" on public.ai_insight_evolution_events for insert
  with check (
    (project_id is not null and exists (select 1 from public.project_members pm where pm.project_id = ai_insight_evolution_events.project_id and pm.user_id = auth.uid()))
    or (tenant_id is not null and exists (select 1 from public.tenant_members tm where tm.tenant_id = ai_insight_evolution_events.tenant_id and tm.user_id = auth.uid()))
  );

-- ---------- AI INSIGHT ROLLUPS WEEKLY ----------
alter table public.ai_insight_rollups_weekly enable row level security;
create policy "ai_rollups_select" on public.ai_insight_rollups_weekly for select
  using (
    (project_id is not null and exists (select 1 from public.project_members pm where pm.project_id = ai_insight_rollups_weekly.project_id and pm.user_id = auth.uid()))
    or (tenant_id is not null and exists (select 1 from public.tenant_members tm where tm.tenant_id = ai_insight_rollups_weekly.tenant_id and tm.user_id = auth.uid()))
  );
create policy "ai_rollups_insert" on public.ai_insight_rollups_weekly for insert
  with check (
    (project_id is not null and exists (select 1 from public.project_members pm where pm.project_id = ai_insight_rollups_weekly.project_id and pm.user_id = auth.uid()))
    or (tenant_id is not null and exists (select 1 from public.tenant_members tm where tm.tenant_id = ai_insight_rollups_weekly.tenant_id and tm.user_id = auth.uid()))
  );
```

**Note:** `tenant_members` role column: if missing in schema, add `role text default 'member'` and use `tm.role = 'owner'` only after adding that column. If no role column, simplify to "any tenant member can manage members/invitations" (replace `and tm.role = 'owner'` with nothing for insert/update/delete).

### 1.4 Indexes for RLS predicates

Already present: `idx_project_members_user_id`, `idx_project_members_project_id`, `idx_tenant_members_tenant_id`. Add if missing:

```sql
create index if not exists idx_media_project_id on public.media(project_id);
create index if not exists idx_ai_analysis_media_id on public.ai_analysis(media_id);
create index if not exists idx_analysis_jobs_media_id on public.analysis_jobs(media_id);
create index if not exists idx_tenant_members_user_id on public.tenant_members(user_id);
```

---

## 2. EDGE SECURITY REFACTOR

### 2.1 All SUPABASE_SERVICE_ROLE_KEY usages

| Location | Purpose | Replace with user JWT? |
|----------|--------|-------------------------|
| `engine/Aistroyk/supabase/functions/aistroyka-ai-memory/index.ts:576` | Single client for all actions (write_snapshot, write_llm_summary, fetch_context_window, run_weekly_rollups, trust_aggregate_daily, incidents, etc.) | **Partially.** fetch_budget_metrics, fetch_schedule_metrics, fetch_contractor_metrics already use user JWT (userSupabase). All other actions currently bypass RLS. |
| `engine/Aistroyk/supabase/functions/aistroyka-llm-copilot/index.ts:282` | Cost check (read ai_llm_logs), insert ai_llm_logs | **No.** Logs are system/audit; no tenant data. Service role acceptable for audit table; optionally add RLS on ai_llm_logs later for read-by-tenant. |
| `engine/Aistroyk/supabase/functions/stripe-webhook/index.ts:55` | Write payments, update billing | **No.** Webhook has no user context; must use service role. |
| `apps/web/lib/supabase/admin.ts` getAdminClient() | Bucket create (upload) | **No.** Bucket creation is admin-only; service role is correct. |
| `apps/web/app/api/projects/[id]/upload/route.ts` | createBucket | Same as above. |
| `apps/web/scripts/seed-supabase-media.mjs` | Seed script | **No.** Ops script. |

### 2.2 aistroyka-ai-memory: tenant-scoped vs system-only

**A) Tenant-scoped (must use user JWT so RLS applies):**
- write_snapshot (insert ai_insight_snapshots, ai_insight_evolution_events)
- write_llm_summary (insert ai_llm_summaries)
- fetch_context_window (read ai_insight_snapshots, ai_llm_summaries, ai_insight_evolution_events, ai_insight_rollups_weekly)
- write_feedback (insert ai_user_feedback)
- list_timeline (read ai_insight_snapshots, ai_llm_summaries)
- list_evolution (read ai_insight_evolution_events, etc.)
- list_portfolio, list_org_daily, list_black_swan (read AI tables by tenant/project)
- ack_black_swan, acknowledge_governance_event (update by tenant)
- get_incident_center, incident_acknowledge, incident_resolve, incident_add_note (incidents by tenant)
- write_recommendation_feedback (insert recommendation_feedback)

**B) System-only (keep service role):**
- run_weekly_rollups (reads all snapshots, writes rollups — cron/job, no user)
- run_health_metrics_daily (reads ai_llm_logs, writes ai_health_metrics_daily — system)
- trust_aggregate_daily (global trust metrics)
- org_aggregate_daily (global org metrics)
- Incident detection/auto-resolve (runs over all tenants — system job)

### 2.3 Refactor: user client + fallback (diff-style)

**File:** `engine/Aistroyk/supabase/functions/aistroyka-ai-memory/index.ts`

**After parsing `body.action` (e.g. after line 596):**

```ts
  const action = body.action
  if (!action || typeof action !== "string") { ... }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")

  const SYSTEM_ONLY_ACTIONS = new Set([
    "run_weekly_rollups",
    "run_health_metrics_daily",
    "trust_aggregate_daily",
    "org_aggregate_daily"
  ])

  const authHeader = req.headers.get("Authorization")
  const useUserClient = !SYSTEM_ONLY_ACTIONS.has(action) && !!authHeader && !!supabaseAnonKey

  const supabase = useUserClient
    ? createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader! } } })
    : createClient(supabaseUrl, supabaseServiceKey)

  if (!useUserClient && !SYSTEM_ONLY_ACTIONS.has(action)) {
    return new Response(JSON.stringify({
      error: "unauthorized",
      message: `${action} requires Authorization header and SUPABASE_ANON_KEY`
    }), { status: 401, headers: { "Content-Type": "application/json" } })
  }
```

**Remove** the later duplicate block that builds `userSupabase` only for domain metrics (lines 1948–1953) and use the single `supabase` above for those actions too; for fetch_budget_metrics/fetch_schedule_metrics/fetch_contractor_metrics require `useUserClient` (already enforced by the 401 when `!useUserClient && !SYSTEM_ONLY`).

**Cron/system caller:** For actions in `SYSTEM_ONLY_ACTIONS`, caller must use a dedicated secret (e.g. `CRON_SECRET`) in header instead of user JWT, and Edge validates that instead of building user client:

```ts
  if (SYSTEM_ONLY_ACTIONS.has(action)) {
    const cronSecret = req.headers.get("x-cron-secret")
    if (cronSecret !== Deno.env.get("CRON_SECRET")) {
      return new Response(JSON.stringify({ error: "forbidden", message: "System action requires x-cron-secret" }), { status: 403, headers: { "Content-Type": "application/json" } })
    }
  }
```

So: **tenant-scoped** = user JWT, **system-only** = x-cron-secret, no user JWT.

---

## 3. AI GOVERNANCE LAYER

### 3.1 Prompt Registry — SQL schema

**File:** `engine/Aistroyk/supabase/migrations/20260302130000_ai_prompts_registry.sql`

```sql
create table if not exists public.ai_prompts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text not null,
  template text not null,
  model text not null default 'gpt-4o-mini',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name, version)
);

create index idx_ai_prompts_name_active on public.ai_prompts(name, active) where active = true;
create index idx_ai_prompts_created_at on public.ai_prompts(created_at desc);

alter table public.ai_prompts enable row level security;
-- Only service role / backend can manage prompts (no user policy; or admin-only policy)
create policy "ai_prompts_select_all" on public.ai_prompts for select using (true);
-- INSERT/UPDATE/DELETE: restrict to service role only (no with check for anon) — i.e. no policy for insert/update/delete so only service_role can.
comment on table public.ai_prompts is 'Prompt registry for LLM Copilot; active=true per name loads in Edge.';
```

**Note:** If RLS "select using (true)" allows anon, then any authenticated user could read prompts (templates are not secret). To restrict to backend only, drop the select policy and use service role in Edge to load prompts.

### 3.2 Edge aistroyka-llm-copilot: load active prompt, log prompt_id, rollback

**Load active prompt:**

```ts
// At startup or per-request (with caching)
async function getActivePrompt(supabase: SupabaseClient, name: string): Promise<{ id: string; template: string; model: string; version: string } | null> {
  const { data, error } = await supabase
    .from("ai_prompts")
    .select("id, template, model, version")
    .eq("name", name)
    .eq("active", true)
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return data as { id: string; template: string; model: string; version: string }
}
// In handler: const promptRow = await getActivePrompt(supabase, "copilot_executive_summary")
// Use promptRow?.template ?? DEFAULT_SYSTEM_PROMPT, promptRow?.model ?? MODEL_DEFAULT
```

**Log prompt_id in ai_llm_logs:** Add column to ai_llm_logs:

```sql
alter table public.ai_llm_logs add column if not exists prompt_id uuid references public.ai_prompts(id);
```

In Edge insert: `prompt_id: promptRow?.id ?? null`.

**Rollback:** Set `active = false` on current version, set `active = true` on previous version (by name, order by created_at desc). No code deploy needed.

### 3.3 Structured Output Guard — code skeleton

**File:** `engine/Aistroyk/supabase/functions/_shared/llmGuard.ts` (or inside aistroyka-llm-copilot)

```ts
const MAX_RETRIES = 2

type ErrorCategory = "invalid_json" | "schema_violation" | "validation_failed" | "empty_response" | "timeout" | "rate_limit" | "unknown"

function classifyError(err: unknown): ErrorCategory {
  if (err instanceof Error) {
    if (/JSON|parse/i.test(err.message)) return "invalid_json"
    if (/schema|type|missing/i.test(err.message)) return "schema_violation"
    if (/validation|length|number/i.test(err.message)) return "validation_failed"
    if (/timeout|ETIMEDOUT/i.test(err.message)) return "timeout"
    if (/429|rate/i.test(err.message)) return "rate_limit"
  }
  return "unknown"
}

interface GuardOptions<T> {
  schema: (raw: unknown) => { ok: boolean; data?: T; reason?: string }
  validate: (data: T) => { ok: boolean; reason?: string }
  maxRetries?: number
}

async function withStructuredOutputGuard<T>(
  call: () => Promise<{ content: string | null }>,
  options: GuardOptions<T>
): Promise<{ success: true; data: T } | { success: false; category: ErrorCategory; reason: string }> {
  const { schema, validate, maxRetries = MAX_RETRIES } = options
  let lastError: ErrorCategory = "unknown"
  let lastReason = ""

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await call()
      const content = res.content?.trim()
      if (!content) {
        lastError = "empty_response"
        lastReason = "Empty LLM response"
        continue
      }
      const raw = JSON.parse(content.replace(/^```json\s*|\s*```$/g, "").trim())
      const parsed = schema(raw)
      if (!parsed.ok) {
        lastError = "schema_violation"
        lastReason = parsed.reason ?? "Schema check failed"
        continue
      }
      const data = parsed.data as T
      const valid = validate(data)
      if (!valid.ok) {
        lastError = "validation_failed"
        lastReason = valid.reason ?? "Validation failed"
        continue
      }
      return { success: true, data }
    } catch (e) {
      lastError = classifyError(e)
      lastReason = e instanceof Error ? e.message : String(e)
    }
  }
  return { success: false, category: lastError, reason: lastReason }
}
```

Use in handler: wrap `openai.chat.completions.create` in `withStructuredOutputGuard`, then either return `data` or fallback and log `category`/`reason` to ai_llm_logs.

---

## 4. LLM EVALUATION PIPELINE

### 4.1 Eval structure

```
engine/Aistroyk/ai-eval/
  datasets/          # JSON fixtures (context + expected shape)
  golden/            # Golden responses (executive_summary, explain_risk)
  runner.ts          # Run evals, compare to golden, exit 1 on regression
```

### 4.2 Golden and regression tests

**datasets/executive_summary_fixture.json:**

```json
{
  "mode": "executive_summary",
  "decision_context": {
    "overall_risk": 45,
    "confidence": 0.72,
    "top_risk_factors": [{"name": "Schedule", "score": 50, "weight": 0.5}],
    "projected_delay_date": null,
    "velocity_trend": "stable",
    "anomalies": [],
    "aggregated_at": "2026-03-01T12:00:00Z"
  }
}
```

**golden/executive_summary_golden.json:** Store expected keys and constraints (e.g. no numbers outside context, tone in [neutral,cautious,urgent]).

**runner.ts (skeleton):**

```ts
import { strict as assert } from "assert"

async function runEval() {
  const fixture = await loadFixture("datasets/executive_summary_fixture.json")
  const golden = await loadFixture("golden/executive_summary_golden.json")
  const res = await callEdgeCopilot(fixture) // or call OpenAI directly with fixed prompt
  const parsed = JSON.parse(res.text ?? "{}")
  assert.ok(parsed.summary, "summary present")
  assert.ok(golden.allowedNumbers && !hasNewNumbers(parsed, golden.allowedNumbers), "no hallucinated numbers")
  assert.ok(["neutral","cautious","urgent"].includes(parsed.tone), "tone valid")
  console.log("Eval OK")
}
runEval().catch((e) => { console.error(e); process.exit(1) })
```

**Regression on prompt change:** CI runs runner.ts after any change to `ai_prompts` or to the default prompt in aistroyka-llm-copilot; if output violates golden constraints, pipeline fails.

### 4.3 CI integration

```yaml
# .github/workflows/ai-eval.yml or in existing workflow
- name: LLM Eval
  run: |
    cd engine/Aistroyk && npx tsx ai-eval/runner.ts
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    EDGE_COPILOT_URL: ${{ secrets.EDGE_COPILOT_URL }}
```

Fail pipeline on non-zero exit. Optionally: run only when `**/ai_prompts/**` or `**/aistroyka-llm-copilot/**` change (path filter).

---

## 5. RAG LAYER (PHASE 2 ARCHITECTURE)

### 5.1 pgvector + embeddings table + RLS

**Migration:** `engine/Aistroyk/supabase/migrations/20260302140000_rag_embeddings.sql`

```sql
create extension if not exists vector;

create table if not exists public.ai_embeddings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  source_type text not null check (source_type in ('milestone', 'task', 'recommendation', 'snapshot_summary', 'media_caption')),
  source_id uuid not null,
  chunk_index int not null default 0,
  chunk text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now(),
  unique(project_id, source_type, source_id, chunk_index)
);

create index idx_ai_embeddings_project on public.ai_embeddings(project_id);
create index idx_ai_embeddings_tenant on public.ai_embeddings(tenant_id);
create index idx_ai_embeddings_vector on public.ai_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table public.ai_embeddings enable row level security;
create policy "ai_embeddings_select_member" on public.ai_embeddings for select
  using (exists (select 1 from public.project_members pm where pm.project_id = ai_embeddings.project_id and pm.user_id = auth.uid()));
create policy "ai_embeddings_insert_member" on public.ai_embeddings for insert
  with check (exists (select 1 from public.project_members pm where pm.project_id = ai_embeddings.project_id and pm.user_id = auth.uid()));
create policy "ai_embeddings_delete_member" on public.ai_embeddings for delete
  using (exists (select 1 from public.project_members pm where pm.project_id = ai_embeddings.project_id and pm.user_id = auth.uid()));
```

### 5.2 Chunking, retrieval, threshold, re-ranking

- **Chunking:** Fixed size (e.g. 500 tokens) with overlap 50; or by section (per milestone/task/summary). Store `chunk_index` and `chunk`.
- **Retrieval query:** Filter by `project_id` (and optionally `tenant_id`) so RLS is satisfied; then `order by embedding <=> query_embedding limit 20`.
- **Similarity threshold:** e.g. `<=> query_embedding < 0.3` (cosine distance); discard above threshold.
- **Re-ranking (optional):** Cross-encoder or keyword boost on chunk text before returning top 5.

### 5.3 Edge integration example

```ts
// In aistroyka-ai-memory or new function aistroyka-rag
if (action === "search_context") {
  const project_id = body.project_id
  const query_embedding = body.query_embedding as number[]
  if (!project_id || !Array.isArray(query_embedding) || query_embedding.length !== 1536) {
    return new Response(JSON.stringify({ error: "invalid_input" }), { status: 400 })
  }
  const { data } = await userSupabase
    .rpc("match_ai_embeddings", { p_project_id: project_id, p_embedding: query_embedding, p_limit: 10, p_threshold: 0.3 })
  return new Response(JSON.stringify({ chunks: data ?? [] }), { headers: { "Content-Type": "application/json" } })
}
```

**RPC (in same migration):**

```sql
create or replace function public.match_ai_embeddings(p_project_id uuid, p_embedding vector(1536), p_limit int default 10, p_threshold float default 0.3)
returns table (id uuid, source_type text, source_id uuid, chunk_index int, chunk text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.project_members pm where pm.project_id = p_project_id and pm.user_id = auth.uid()) then
    return;
  end if;
  return query
  select e.id, e.source_type, e.source_id, e.chunk_index, e.chunk
  from public.ai_embeddings e
  where e.project_id = p_project_id
    and (e.embedding <=> p_embedding) < p_threshold
  order by e.embedding <=> p_embedding
  limit p_limit;
end;
$$;
```

So: RPC runs as definer but enforces `project_members` for `p_project_id`; returns chunks within similarity threshold.

---

## 6. OBSERVABILITY UPGRADE

### 6.1 Structured log schema (ai_llm_logs v2)

**Migration:** add columns to ai_llm_logs (or new table ai_llm_logs_v2):

```sql
alter table public.ai_llm_logs add column if not exists request_id text;
alter table public.ai_llm_logs add column if not exists tenant_id uuid;
alter table public.ai_llm_logs add column if not exists project_id uuid;
alter table public.ai_llm_logs add column if not exists prompt_id uuid references public.ai_prompts(id);
alter table public.ai_llm_logs add column if not exists fallback_reason text;
create index idx_ai_llm_logs_request_id on public.ai_llm_logs(request_id) where request_id is not null;
create index idx_ai_llm_logs_tenant_created on public.ai_llm_logs(tenant_id, created_at desc) where tenant_id is not null;
```

Schema fields: request_id, tenant_id, project_id, prompt_version, prompt_id, tokens, latency_ms, fallback_reason (and existing fields).

### 6.2 Tracing correlation id + error taxonomy

- **request_id:** Generate UUID per request in Edge; pass to all logs and to response header `X-Request-Id`.
- **Error taxonomy enum:** Add table or use constant: `invalid_json | schema_violation | validation_failed | budget_exceeded | user_limit_exceeded | no_api_key | timeout | rate_limit | unknown`. Store in `model_version` or new column `error_category`.

### 6.3 Middleware and ai_llm_logs insert example

**Middleware (Edge):** At entry, `const requestId = crypto.randomUUID()`. Set `response.headers.set("X-Request-Id", requestId)`. Pass requestId into logger and into ai_llm_logs insert.

**Insert example:**

```ts
await supabase.from("ai_llm_logs").insert({
  request_id: requestId,
  tenant_id: body.tenant_id ?? null,
  project_id: body.project_id ?? null,
  user_id: userId,
  mode,
  tokens_used: tokensUsed,
  latency_ms: latencyMs,
  cached: false,
  validation_passed: validationPassed,
  fallback_used: fallbackUsed,
  fallback_reason: fallbackUsed ? (modelVersion ?? "unknown") : null,
  context_version: CONTEXT_VERSION,
  prompt_version: promptVersion,
  prompt_id: promptRow?.id ?? null,
  model_version: modelVersion
})
```

---

## 7. ENTERPRISE READINESS CHECKLIST

| Layer | Current | Required | Gap | Priority |
|-------|---------|----------|-----|-----------|
| **RLS** | projects, project_budget, cost_items, commitments + project_members | All tenant/project tables isolated | media, ai_analysis, analysis_jobs, tenants, tenant_members, milestones, tasks, contractors, recommendations, ai_* tables still permissive or no RLS | P0 |
| **Edge security** | Service role for most ai-memory; user JWT only for fetch_budget/schedule/contractor_metrics | User JWT for all tenant-scoped actions; service role only for system/cron | Refactor ai-memory to user client + CRON_SECRET for system actions | P0 |
| **AI governance** | Inline prompts, no registry | Prompt registry, versioning, rollback, prompt_id in logs | Add ai_prompts, load in Edge, log prompt_id; rollback via active flag | P1 |
| **Observability** | ai_llm_logs (tokens, latency, validation, fallback); no request_id/tenant_id | request_id, tenant_id, project_id, fallback_reason, error taxonomy | Add columns and middleware | P1 |
| **Eval** | None | Golden tests, regression on prompt change, CI fail on degradation | Add ai-eval/, runner, CI step | P1 |
| **Scaling** | Single worker, RPC dequeue | Same; optional tenant/region affinity | Document; optional later | P2 |
| **Cost control** | LLM_MONTHLY_TOKEN_BUDGET, LLM_PER_USER_MONTHLY_LIMIT in Edge | Already present | Optional dashboard from ai_llm_logs | P2 |

---

## 8. 30-DAY ROADMAP

### Week 1 — Security lockdown
- [ ] Apply migration `20260302120000_rls_enterprise_final.sql` (and fix tenant_members role if needed).
- [ ] Add indexes (media project_id, ai_analysis media_id, analysis_jobs media_id, tenant_members user_id).
- [ ] Refactor aistroyka-ai-memory: user JWT client for non–system actions; require Authorization for tenant-scoped; add CRON_SECRET for run_weekly_rollups, run_health_metrics_daily, trust_aggregate_daily, org_aggregate_daily.
- [ ] Run RLS tests (iOS RLSValidationTests + manual or automated Supabase checks).

### Week 2 — Governance layer
- [ ] Add migration `20260302130000_ai_prompts_registry.sql`; seed one row (name=`copilot_executive_summary`, version=1, active=true).
- [ ] In aistroyka-llm-copilot: load active prompt from ai_prompts; add prompt_id to ai_llm_logs; fallback to inline default if no row.
- [ ] Implement Structured Output Guard (withStructuredOutputGuard, retry 2, error classification); integrate into LLM handler.
- [ ] Document rollback: set active=false on current, active=true on previous.

### Week 3 — Eval + CI
- [ ] Create engine/Aistroyk/ai-eval/ (datasets/, golden/, runner.ts).
- [ ] Golden executive_summary test; hallucination numeric test; schema/tone checks.
- [ ] Add CI job to run runner.ts; fail on regression; optional path filter for prompt/Edge changes.

### Week 4 — RAG integration (Phase 2)
- [ ] Add migration 20260302140000_rag_embeddings.sql; RPC match_ai_embeddings with RLS-safe check.
- [ ] Chunking job or on-write: milestones, tasks, snapshot summaries → embeddings (OpenAI embeddings API); insert into ai_embeddings.
- [ ] Edge action search_context with user JWT; return top-k chunks for Copilot historical_context or separate RAG endpoint.
- [ ] Observability: request_id, tenant_id, project_id, fallback_reason in ai_llm_logs; X-Request-Id header.

---

*End of plan. All SQL and code is production-oriented; run migrations in order and test in staging first.*
