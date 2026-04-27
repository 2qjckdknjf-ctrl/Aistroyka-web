# Wave 4 Step 7 — RLS / data-plane backend report

**Date:** 2026-03-29

## B1 — Minimal fix pattern

1. **`is_internal_tenant_reader_for_tenant(tenant_id)`**  
   `SECURITY DEFINER`, stable: **tenant owner** (`tenants.user_id`) OR `tenant_members.role IN ('owner','admin','member','viewer')`.  
   **Excludes** `stakeholder`.

2. **`is_portal_stakeholder_for_project(project_id)`**  
   Active `project_stakeholders` row for `auth.uid()`.

3. **`is_portal_stakeholder_for_document(document_id)`**  
   Resolves `project_id` via `project_documents`.

## B2 — Policy shapes

| Class | SELECT | INSERT/UPDATE/DELETE |
|-------|--------|----------------------|
| **Project-scoped** (projects, milestones, documents, costs, issues, estimates, risks, worker_*, client_requests, …) | `is_internal_tenant_reader_for_tenant(tenant_id) OR is_portal_stakeholder_for_project(project_id)` | Internal only |
| **projects** | Same for `id` as project id | Internal only |
| **project_document_events** | Internal OR `is_portal_stakeholder_for_document(document_id)` | Internal only |
| **project_stakeholders** | **Invite** + **email** + **internal** + **user_id**; **WITH CHECK** mirrors **USING** so invite accept **UPDATE** works |
| **Tenant-wide internal** (AI, sync, jobs, idempotency, …) | Internal only | Internal only |

## B3 — Curated API

- **Portal** still **shapes** responses in Next.js (`client-view`, client-requests).  
- **RLS** now **aligns** with portal intent: stakeholders **cannot** read arbitrary tenant rows; project-scoped reads require **stakeholder** link to that **project**.

## B4 — Backward compatibility

- **Internal** `viewer` / `member` / `admin` / `owner` unchanged for predicates.  
- **Tenant owners** without `tenant_members` still covered by `is_internal` (tenant owner branch).

## B5 — Risks

- **Migration order** must run after `20260330150000` (`stakeholder` role exists).  
- **PostgREST** direct access: same RLS as app; **service role** bypasses RLS (unchanged).  
- **Any** table not yet migrated in a later migration would still use old policies until applied — see inventory.
