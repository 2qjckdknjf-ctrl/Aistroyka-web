# RBAC P0 Fix Evidence

**Date:** 2026-06-20

---

## P0-1 — Stakeholder middleware fail-closed

**Changed:**

- `apps/web/lib/tenant/stakeholder-protected-path-gate.ts` (new)
- `apps/web/middleware.ts` — removed fail-open catch; uses gate with `roleLookupFailed`

**Tests:**

- `apps/web/lib/tenant/stakeholder-protected-path-gate.test.ts`

**Behavior:**

- Role lookup error on `/dashboard`, `/admin`, `/billing`, `/portal`, etc. → redirect (fail-closed), header `X-Auth-Redirect: stakeholder-gate-fail-closed`
- Stakeholder on internal paths → redirect as before

---

## P0-2 — Owner tenant metadata-only

**Changed:**

- `apps/web/lib/platform-owner/tenant-metadata.service.ts` (new)
- `apps/web/app/api/v1/owner/tenants/[tenantId]/route.ts` — metadata DTO only + audit
- `apps/web/app/api/v1/owner/tenants/route.ts` — list without `user_id`
- `apps/web/app/[locale]/(owner)/owner/owner-console-client.tsx` — type alignment

**Removed from default tenant detail response:**

- `members[]` with `user_id`
- `invitations[]` with emails
- `projects[]` with names

**Returned instead:**

- Counts, plan, billing status, AI usage aggregates (30d), health counters (failed jobs 24h, open support)

**Tests:**

- `apps/web/app/api/v1/owner/tenants/[tenantId]/route.test.ts`

---

## P0-3 — Break-glass foundation

**Migration:**

- `apps/web/supabase/migrations/20260620140442_rbac_stage1_security_hardening.sql`
  - Table `platform_break_glass_grants`
  - Scopes: `tenant_metadata`, `tenant_members`, `tenant_projects`, `project_content`, `support_content`

**Code:**

- `apps/web/lib/platform-owner/break-glass.service.ts`
  - `hasActiveBreakGlassAccess()`
  - `requireBreakGlassAccess()` — audits allow/deny via `insertPlatformOwnerAudit`

**Tests:**

- `apps/web/lib/platform-owner/break-glass.service.test.ts`

**Not in this stage:** HTTP routes to request/approve grants; wiring business-content owner endpoints to `requireBreakGlassAccess`.

---

## P0-4 — Project-scoped `project_members` RLS

**Migration (same file):**

- `can_read_project_membership(tenant_id, project_id)`
- `can_manage_project_membership(tenant_id, project_id)`
- Policies: `project_members_select_scoped`, `_insert_scoped`, `_update_scoped`, `_delete_scoped`

**Logic:**

- Tenant owner / tenant `admin` → all rows in tenant
- Others → only rows for projects where user has active `project_members` row

**Tests:**

- `apps/web/lib/tenant/project-members-rls-intent.test.ts` (SQL intent mirror)

**Apply (live):** applied 2026-06-20 to Supabase project `vthfrxehrursfloevnlp` via MCP `apply_migration` (local Supabase CLI unavailable — arch mismatch).

**Live DB evidence:**

- Migration row: `20260620140442_rbac_stage1_security_hardening`
- Policies on `project_members`: scoped quartet only; `project_members_internal` absent
- Select `USING`: `is_internal_tenant_reader_for_tenant(tenant_id) AND can_read_project_membership(tenant_id, project_id)`

---

## P0-5 — Internal business scope guard

**Changed:**

- `apps/web/lib/security/internal-business-scope.ts` (new)
- `apps/web/lib/domain/costs/cost.service.ts` — all public functions
- Routes:
  - `apps/web/app/api/v1/projects/[id]/costs/route.ts`
  - `apps/web/app/api/v1/projects/[id]/costs/[costItemId]/route.ts`
  - `apps/web/app/api/v1/projects/[id]/estimate/route.ts`
  - `apps/web/app/api/v1/projects/[id]/estimate/from-image/route.ts`
  - `apps/web/app/api/v1/projects/[id]/intelligence/route.ts`

**Denied roles:** `stakeholder`, `viewer`  
**Allowed:** `owner`, `admin`, `member`

**Tests:**

- `apps/web/lib/security/internal-business-scope.test.ts`
- `apps/web/lib/domain/costs/cost.service.test.ts` (viewer + stakeholder)
- `apps/web/app/api/v1/projects/[id]/costs/route.test.ts` (viewer route guard)
- `apps/web/app/api/v1/projects/[id]/intelligence/route.test.ts` (stakeholder)

---

## Full file list (code)

| File | Action |
|------|--------|
| `apps/web/middleware.ts` | Modified |
| `apps/web/lib/tenant/stakeholder-protected-path-gate.ts` | Added |
| `apps/web/lib/tenant/stakeholder-protected-path-gate.test.ts` | Added |
| `apps/web/lib/security/internal-business-scope.ts` | Added |
| `apps/web/lib/security/internal-business-scope.test.ts` | Added |
| `apps/web/lib/platform-owner/break-glass.service.ts` | Added |
| `apps/web/lib/platform-owner/break-glass.service.test.ts` | Added |
| `apps/web/lib/platform-owner/tenant-metadata.service.ts` | Added |
| `apps/web/lib/tenant/project-members-rls-intent.test.ts` | Added |
| `apps/web/supabase/migrations/20260620140442_rbac_stage1_security_hardening.sql` | Added |
| `apps/web/app/api/v1/owner/tenants/route.ts` | Modified |
| `apps/web/app/api/v1/owner/tenants/[tenantId]/route.ts` | Modified |
| `apps/web/app/api/v1/owner/tenants/[tenantId]/route.test.ts` | Added |
| `apps/web/app/api/v1/projects/[id]/costs/route.ts` | Modified |
| `apps/web/app/api/v1/projects/[id]/costs/route.test.ts` | Modified |
| `apps/web/app/api/v1/projects/[id]/costs/[costItemId]/route.ts` | Modified |
| `apps/web/app/api/v1/projects/[id]/estimate/route.ts` | Modified |
| `apps/web/app/api/v1/projects/[id]/estimate/from-image/route.ts` | Modified |
| `apps/web/app/api/v1/projects/[id]/intelligence/route.ts` | Modified |
| `apps/web/app/api/v1/projects/[id]/intelligence/route.test.ts` | Modified |
| `apps/web/lib/domain/costs/cost.service.ts` | Modified |
| `apps/web/lib/domain/costs/cost.service.test.ts` | Modified |
| `apps/web/app/[locale]/(owner)/owner/owner-console-client.tsx` | Modified |
| `docs/architecture/RBAC_STAGE1_SECURITY_CLOSURE.md` | Added |
| `docs/architecture/RBAC_P0_FIX_EVIDENCE.md` | Added |

---

## Test run (2026-06-20)

```
bun run lint          → PASS
bun run test -- --run → PASS (331 files, 1665 tests)
Targeted RBAC suite  → PASS (5 files, 16 tests)
bun run build         → FAIL (Volta/next exit 126 — environment)
```

---

## Live activation evidence (2026-06-20)

| Item | Evidence |
|------|----------|
| Project | `vthfrxehrursfloevnlp` |
| Migration applied | YES |
| Remote version / name | `20260620140442` / `rbac_stage1_security_hardening` |
| Repo file | `20260620140442_rbac_stage1_security_hardening.sql` (aligned with remote) |
| `platform_break_glass_grants` + RLS | verified |
| Helper functions | `can_read_project_membership`, `can_manage_project_membership` verified |
| `project_members` policies | scoped policies active; legacy tenant-wide read policy absent |

---

## Remaining risks

1. **Local Supabase CLI broken** — cannot dry-run/push from workstation until CLI arch fixed or repo linked via `supabase link`.
2. **Break-glass not wired to HTTP** — table + service only; no grant UI/routes.
3. **Build env** — `bun run build` still fails (Volta/Next exit 126) in audit environment.

---

## Migration timestamp reconciliation (2026-06-20)

| Item | Value |
|------|-------|
| Remote version | `20260620140442` / `rbac_stage1_security_hardening` |
| Repo file (aligned) | `apps/web/supabase/migrations/20260620140442_rbac_stage1_security_hardening.sql` |
| SQL content changed | **NO** — filename-only rename from prior working copy `20260620160000_*` |
| Live objects verified | `platform_break_glass_grants`, project_members RLS helpers |

Repo filenames now match remote Supabase migration history; future CLI `db push` re-apply risk reduced.

---

## Verdict

**P0 LIVE CLOSED** — application-layer Stage 1 deliverables plus live DB objects for P0-3/P0-4 on project `vthfrxehrursfloevnlp`.
