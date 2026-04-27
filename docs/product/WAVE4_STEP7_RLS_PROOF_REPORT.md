# Wave 4 Step 7 — RLS proof / regression report

**Date:** 2026-03-29

## D1 — Allowed stakeholder flows (app + data plane intent)

| Flow | Evidence |
|------|----------|
| Portal routing | Prior middleware + `DashboardShell` (unchanged this sprint) |
| `client-view` API | Uses project-scoped tables; RLS now allows read only for internal **or** portal stakeholder on that **project** |
| Client requests | `project_client_requests` / events policies updated |
| Project list/detail API | `projects` SELECT allows stakeholder only for linked projects |

## D2 — Denied internal flows

| Area | Mechanism |
|------|-----------|
| Tenant-wide AI, sync, jobs, idempotency, ops, entitlements (select), etc. | `is_internal_tenant_reader_for_tenant` only |
| Raw `project_members` / `task_assignments` | Internal only |
| `upload_sessions` | Internal only |
| Manager notifications | Internal only |

## D3 — Automated tests (CI)

- Full Vitest suite: **1172** tests **pass** (includes `tenant.policy`, `stakeholder-dashboard-paths`, `rls-stakeholder-predicates`).
- Production build: **pass**.

## D4 — What is not proven in CI

- **Live** Postgres RLS evaluation against a real Supabase project (requires `supabase db push` / migration apply).  
- **Recommended** manual smoke after migrate: sign in as stakeholder, open client portal; attempt `select` on `ai_memory_records` or `jobs` via SQL editor — expect **no rows** (or denied).
