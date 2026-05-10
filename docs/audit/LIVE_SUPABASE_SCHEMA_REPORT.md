# Live Supabase Schema Report

> **2026-05-09:** Re-verified via Cursor MCP `user-supabase`: `list_tables` + `list_migrations` on project `https://vthfrxehrursfloevnlp.supabase.co`. Local CLI **`supabase projects list`** may still return **Unauthorized** until `SUPABASE_ACCESS_TOKEN` is a real **Account PAT** (see `apps/web/.env.local.example`).

Date: 2026-05-07 (first report); **live refresh 2026-05-09** (MCP)

Phase: 0 - Live Truth Verification

Supabase project URL: `https://vthfrxehrursfloevnlp.supabase.co`

Verdict: REQUIRED TABLES PRESENT (2026-05-09 MCP `list_tables`), MIGRATIONS CHAIN PRESENT (`list_migrations`)

## Live Project Evidence

Tool: Supabase MCP `get_project_url`

Result:

```text
https://vthfrxehrursfloevnlp.supabase.co
```

This matches `NEXT_PUBLIC_SUPABASE_URL` in `apps/web/wrangler.toml` and `apps/web/wrangler.deploy.toml`.

## 2026-05-09 — compact MCP table check (roadmap + core)

The following **`public`** tables were reported **present** by MCP `list_tables` on 2026-05-09 (not an exhaustive list of all tables):

| Group | Tables |
|-------|--------|
| Core | `tenants`, `tenant_members`, `projects`, `project_members`, `worker_tasks`, `worker_reports`, `media`, `upload_sessions`, `project_documents`, `project_cost_items`, `project_milestones`, `audit_logs` |
| Roadmap | `project_client_requests`, `project_client_request_events`, `customer_estimates`, `customer_estimate_items`, `project_change_orders`, `project_change_order_events`, `proof_pack_shares`, `project_defects`, `project_defect_events`, `project_handover`, `project_handover_events`, `project_commercial_items`, `tenant_contractor_profiles` |
| Telegram | `telegram_link_tokens`, `user_telegram_links`, `telegram_delivery_audit` |

**Advisory (MCP):** 11 tables have **RLS disabled** (e.g. some `ai_*` catalog / `roles` / `permissions`). Address in a dedicated RLS/policy task — not part of this schema-presence verification.

Tail of applied migration versions (2026-05-09 `list_migrations`) includes: `phase6_proof_pack_shares`, `phase10_telegram_integration`, `phase11_tenant_contractor_profiles`, `20260508052004_project_defects_severity_and_photos`, etc.


> **Historical (earlier session):** The SQL + result table below are from a prior read-only check; **2026-05-09** truth for presence is the MCP `list_tables` summary above.


```sql
select required.table_name, (t.table_name is not null) as present, coalesce(c.relrowsecurity, false) as rls_enabled
from (values
  ('tenants'),
  ('tenant_members'),
  ('projects'),
  ('project_members'),
  ('worker_tasks'),
  ('worker_reports'),
  ('media'),
  ('upload_sessions'),
  ('project_documents'),
  ('project_cost_items'),
  ('project_milestones'),
  ('audit_logs'),
  ('alerts')
) as required(table_name)
left join information_schema.tables t
  on t.table_schema = 'public' and t.table_name = required.table_name
left join pg_class c
  on c.relname = required.table_name
left join pg_namespace n
  on n.oid = c.relnamespace and n.nspname = 'public'
order by required.table_name;
```

Result:

| Table | Present | RLS enabled |
|---|---:|---:|
| `alerts` | yes | yes |
| `audit_logs` | yes | yes |
| `media` | yes | yes |
| `project_cost_items` | yes | yes |
| `project_documents` | yes | yes |
| `project_members` | yes | yes |
| `project_milestones` | yes | yes |
| `projects` | yes | yes |
| `tenant_members` | yes | yes |
| `tenants` | yes | yes |
| `upload_sessions` | yes | yes |
| `worker_reports` | yes | yes |
| `worker_tasks` | yes | yes |

## Migration Evidence

Tool: Supabase MCP `list_migrations`

Result: live migration history is available and includes Phase 0 required foundations, including:

- `20260303000000 base_tenants_projects`
- `20260304000400 upload_sessions`
- `20260306000000 rbac`
- `20260306100000 project_members_task_assignments`
- `20260306130000 reports_task_id`
- `20260306140000 worker_tasks_extend`
- `20260306300000 audit_retention`
- `20260307200000 project_milestones`
- `20260307400000 project_documents`
- `20260307500000 project_cost_items`
- `20260329100000 project_client_portal`
- `20260329120000 project_stakeholders`
- `20260401132230 20260402120000_project_change_orders`
- `20260418085301 project_commercial_items`
- `20260507062905 phase0_customer_finance_isolation`

Note: live migration names after some dates include file names inside the name field, but the expected domains are present.

## Advisor Evidence

Tool: Supabase MCP `list_tables`

Important advisory included in the table response:

```text
rls_disabled critical:
11 public tables have Row Level Security disabled:
permissions, ai_optimization_packages, ai_optimization_decisions, ai_eval_cases,
ai_provider_health, ai_eval_results, ai_optimization_experiments, role_permissions,
tenant_concurrency, ai_optimization_comparisons, roles.
```

Tool: Supabase MCP `get_advisors` with `type=security`

Security advisor highlights:

- `RLS Disabled in Public` ERROR for multiple public tables, including `roles`, `role_permissions`, `permissions`, `tenant_concurrency`, `ai_provider_health`, `ai_eval_cases`, `ai_eval_results`, and AI optimization tables.
- `RLS Policy Always True` WARN on multiple tables, including `projects`, `tenants`, `tenant_members`, `media`, `ai_analysis`, `ai_cost_events`, `payments`, `plans`, `pricing_rules`, `workers`, and others.
- `Public Can Execute SECURITY DEFINER Function` WARN for multiple functions callable by `anon`, including portal-related functions such as `is_portal_stakeholder_for_project` and `is_portal_stakeholder_for_document`.
- `Signed-In Users Can Execute SECURITY DEFINER Function` WARN for multiple functions callable by `authenticated`.
- `Function Search Path Mutable` WARN on many public functions.
- `Leaked Password Protection Disabled` WARN for Supabase Auth.

Tool: Supabase MCP `get_advisors` with `type=performance`

Performance advisor output was available but very large. The first visible class of findings was `Unindexed foreign keys` INFO. A full performance cleanup was not part of Phase 0 implementation.

## Finance-Relevant Policy Evidence

Read-only SQL executed:

```sql
select schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
from pg_policies
where schemaname='public'
  and tablename in ('project_cost_items','projects','project_change_orders')
order by tablename, policyname;
```

Critical results:

```text
project_cost_items_select_portal:
(is_internal_tenant_reader_for_tenant(tenant_id) OR is_portal_stakeholder_for_project(project_id))

change_orders_select:
(is_internal_tenant_reader_for_tenant(tenant_id) OR is_portal_stakeholder_for_project(project_id))

projects:
Allow all for projects, projects_insert_service, projects_update_service with true-style policies are present.
```

This means live Supabase currently allows portal stakeholders to select `project_cost_items`, which conflicts with the roadmap rule that customers must never see internal cost items, actual costs, budget pressure, or overruns.

## Phase 0 Remediation Applied

Applied live migration:

```text
phase0_customer_finance_isolation
```

Local migration file:

```text
apps/web/supabase/migrations/20260507062500_phase0_customer_finance_isolation.sql
```

Post-remediation live policy verification:

```text
project_cost_items_internal_select:
is_internal_tenant_reader_for_tenant(tenant_id)

project_cost_items_internal_insert:
with check is_internal_tenant_reader_for_tenant(tenant_id)

project_cost_items_internal_update:
using/with check is_internal_tenant_reader_for_tenant(tenant_id)

project_cost_items_internal_delete:
is_internal_tenant_reader_for_tenant(tenant_id)
```

Post-remediation live data verification:

```text
projects_with_client_budget_enabled = 0
```

## Migration Dry-Run Status

Initial Phase 0 used read-only live checks. During remediation, one schema/data migration was applied to live Supabase to close the direct customer finance isolation blocker.

Migration state known: YES, via Supabase MCP `list_migrations`.

## Latest Production Alignment Recheck - 2026-05-07 06:51-06:54 UTC

Supabase schema state was not changed in this recheck. The previous live verification remains the current Supabase evidence:

```text
Required Phase 0 tables: present
Live migration includes: phase0_customer_finance_isolation
project_cost_items policies: internal-only select/insert/update/delete
projects_with_client_budget_enabled = 0
```

Production runtime was later restored through GitHub Actions deploy run `25481116848`:

```text
Production /api/v1/health -> ok=true, env=production, buildStamp=62a1659 / 2026-05-07 07:01
Production smoke -> PASS
```

The deployed production commit is `62a1659`. The finance-isolation code remediation remains local and not yet deployed until committed/pushed; the live Supabase RLS/data mitigation is already applied.

## Risks And Blockers

- Required Phase 0 tables exist.
- Direct customer finance isolation blocker on `project_cost_items` portal SELECT is fixed live.
- Public-schema RLS disabled and permissive policy advisories remain open live risks outside this targeted Phase 0 finance isolation fix.
- Production runtime health now passes.
- Cloudflare tail/secret diagnostics remain blocked for the local `.env.cf` token, but GitHub Actions deploy works through repository secrets.
- Finance-isolation code remediation is not production-deployed until committed/pushed or deployed with a Worker publish-capable local token.

## Supabase Truth Verdict

Live required table presence verified: YES

Live migration history known: YES

Advisors checked: YES

Customer finance RLS clean: YES

All Supabase security advisors clean: NO

Production runtime health verified: YES

Finance-isolation code deployed to production: YES, production build `3fda021 / 2026-05-07 08:06`

Finance-isolation code deployed to staging: YES, staging build `3fda021 / 2026-05-07 08:02`

Verdict: CLOSED for Phase 0. Broader Supabase advisor backlog remains tracked as non-Phase-0 hardening work.

PHASE 0 CLOSED: YES
