# RBAC Stage 1 — Security Closure Report

**Date:** 2026-06-20  
**Scope:** P0 fixes only (no account_type, no client-led, no cabinet redesign).

---

## P0 closure table

| ID | Fix | Status | Evidence |
|----|-----|--------|----------|
| P0-1 | Stakeholder middleware fail-closed | **CLOSED** | `stakeholder-protected-path-gate.ts`, `middleware.ts`, tests |
| P0-2 | Platform owner tenant API metadata-only | **CLOSED** | `tenant-metadata.service.ts`, owner tenant routes, route test |
| P0-3 | Break-glass foundation | **CLOSED** (foundation, live DB) | Migration applied on `vthfrxehrursfloevnlp`; `break-glass.service.ts`; no business-content routes wired yet |
| P0-4 | Project-scoped `project_members` RLS | **CLOSED** (live DB) | Migration applied + live policy verification on `vthfrxehrursfloevnlp` |
| P0-5 | Central internal business scope guard | **CLOSED** | `internal-business-scope.ts`, costs/estimate/intelligence routes + service |

---

## Live activation (2026-06-20)

**Target project:** `vthfrxehrursfloevnlp` (AISTROYKA, eu-central-1)

| Step | Result |
|------|--------|
| Repo migration file present | YES — `apps/web/supabase/migrations/20260620140442_rbac_stage1_security_hardening.sql` |
| Migration SQL safety review | PASS — additive DDL + policy replace only; no destructive drops |
| Local Supabase CLI | **BLOCKED** — `/usr/local/bin/supabase` Bad CPU type (arch mismatch); no `supabase/config.toml` link in repo |
| Apply path | Supabase MCP `apply_migration` on linked project `vthfrxehrursfloevnlp` |
| Migration applied | **YES** — remote version `20260620140442`, name `rbac_stage1_security_hardening` |

**Migration list evidence (tail):** `20260619220213_worker_report_worker_note_smoke_unblock` → `20260620140442_rbac_stage1_security_hardening`

### Live DB verification

| Check | Live result |
|-------|-------------|
| `platform_break_glass_grants` exists | YES |
| RLS enabled on `platform_break_glass_grants` | YES (`relrowsecurity = true`) |
| Client policies on break-glass table | 0 (service-role only) |
| `can_read_project_membership` function | YES |
| `can_manage_project_membership` function | YES |
| `project_members` scoped policies active | YES — `project_members_select_scoped`, `_insert_scoped`, `_update_scoped`, `_delete_scoped` |
| Legacy `project_members_internal` policy | **NOT ACTIVE** (absent) |
| Select policy uses project scope | YES — `is_internal_tenant_reader_for_tenant(tenant_id) AND can_read_project_membership(tenant_id, project_id)` |

---

## Strict verdict

## **P0 LIVE CLOSED** (Stage 1 scope — app + DB)

**Caveats (not P0 blockers):**

- Break-glass table exists; **no platform route yet exposes business content via grant** — default owner paths are metadata-only.
- `GET /api/v1/owner/users` still returns membership user IDs (platform ops metadata); not tenant document/business content.
- Repo migration filename matches remote history (`20260620140442_rbac_stage1_security_hardening.sql`; reconciled 2026-06-20).
- `bun run build` failed in audit env (Volta/Next `exit 126`) — unrelated to these changes.

---

## Remaining P1/P2 (unchanged)

- Account types (`platform` / `contractor` / `client`)
- Client-led projects + cross-tenant participants
- Foreman role split from `member`
- Cabinet route rename (`/platform`, `/client`)
- Unified client ops CRM
- Owner `/users` metadata minimization (optional hardening)

See `RBAC_GAP_ANALYSIS.md`.

---

## Validation run

| Check | Result |
|-------|--------|
| `bun run lint` | PASS (2026-06-20 live activation) |
| `bun run test -- --run` | PASS — 331 files, 1665 tests |
| Targeted RBAC tests | PASS — 5 files, 16 tests (stakeholder gate, internal scope, break-glass, project_members RLS intent, owner tenant metadata) |
| `bun run build` | FAIL — Volta could not execute `next build` (env) |

---

## Next recommended step

**Stage 2 sprint:** additive `account_type` + client signup tenant bootstrap (per `RBAC_IMPLEMENTATION_PLAN.md`).
