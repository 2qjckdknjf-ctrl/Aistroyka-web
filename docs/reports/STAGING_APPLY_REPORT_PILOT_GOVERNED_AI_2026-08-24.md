# Staging Migration Apply Report — Pilot Governed AI (Reconciled)

**Date:** 2026-08-24  
**PR:** https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/244  
**Supabase project:** AISTROYKA (`vthfrxehrursfloevnlp`, eu-central-1) — **staging only**  
**Production:** **NOT TOUCHED**

## Reconciliation summary

| Item | State |
|------|-------|
| Removed local file | `20260824120000_pilot_governed_ai_evidence.sql` (never applied to staging) |
| Staging-applied versions (already on remote) | `20260824122312`, `20260824122423`, `20260824123120` |
| Local files now match staging version IDs | **YES** |
| Forward-fix pending on staging | `20260824150000_pilot_governed_ai_evidence_security_hardening.sql` |
| Backfill | **NONE** |
| Production migration | **NONE** |

## Why `revoked_at` → `status = 'active'`

Staging `project_stakeholders` uses `status IN ('invited','active','revoked')` (see `20260329120000_project_stakeholders.sql`). There is no `revoked_at` column on this table. All RLS and executor membership checks now require `status = 'active'`.

## Why `worker_day.project_id` removed from resolution

Staging `worker_day` has no reliable `project_id` column for report linkage. Allowed resolution path: `worker_reports.task_id → worker_tasks.project_id`. Day-only legacy reports return `null` project; evidence sync is skipped fail-closed (observable diagnostic, not false success).

## Schema drift fixes in forward migration `20260824150000`

- Drop legacy broad policies (`visual_evidence_tenant_internal`, client-writable audit/completeness)
- `service_role`-only INSERT/UPDATE for `ai_action_audit_records` and `report_completeness_evaluations`
- Split visual evidence policies + `guard_visual_evidence_visibility_columns` trigger
- Stakeholder read uses `project_stakeholders.status = 'active'`

## Apply status

| Migration | Remote history | Local file | Staging schema |
|-----------|----------------|------------|----------------|
| `20260824122312` | APPLIED (pre-PR agent) | present | tables exist |
| `20260824122423` | APPLIED | present | search_path hardened |
| `20260824123120` | APPLIED | present | task-only trigger |
| `20260824150000` | **NOT APPLIED** | present | **BLOCKED** — see below |

### `supabase db push` result

```
Remote migration versions not found in local migrations directory (pre-existing staging-only versions, unrelated to pilot slice)
Exit code: 1 — push aborted before applying 20260824150000
```

Pilot slice versions (`20260824122312`–`23120`) no longer appear in the mismatch list after reconciliation.

**Blocker:** Supabase CLI requires repair of 84 historical remote-only versions OR owner-provided DB password for direct SQL apply. This slice does **not** perform undocumented migration history repair.

**Recommended owner action:** Apply `20260824150000_pilot_governed_ai_evidence_security_hardening.sql` via Supabase SQL editor on staging, then record version:

```bash
supabase migration repair --status applied 20260824150000
```

## Combined pilot slice checksum (SHA-256)

```
$(cat apps/web/supabase/migrations/20260824122312_*.sql \
       apps/web/supabase/migrations/20260824122423_*.sql \
       apps/web/supabase/migrations/20260824123120_*.sql \
       apps/web/supabase/migrations/20260824150000_*.sql | shasum -a 256)
```

Run at commit time on branch head for exact value.

## Local validation

| Check | Result |
|-------|--------|
| Migration contract tests | PASS |
| `bun run test` | PASS (1842) |
| `bun run cf:build` | PASS |
| Supabase local reset/replay | **NOT TESTED** (Docker unavailable) |
| Supabase security advisor (remote) | **NOT TESTED** (MCP auth timeout / no DB password) |

## Authenticated staging E2E

**BLOCKED_EXTERNAL** — `PILOT_E2E_*` / `E2E_*` credentials not present in local operator env (`.env.pilot`, `.env.local`). Script prepared: `scripts/pilot/governed-ai-owner-evidence-staging-e2e.mjs`.

## Remaining risks

- Staging may retain client-writable completeness/audit policies until `20260824150000` is applied.
- Authenticated 18-step chain unproven without QA persona credentials in operator session.
