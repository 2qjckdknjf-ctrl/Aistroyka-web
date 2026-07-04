# ROMA Run History Implementation V1 Report

**Date:** 2026-07-04  
**Branch:** `security/platform-admin-separation`  
**Verdict:** Owner-only append-only audit run persistence — explicit Save Snapshot only

---

## Migration

**File:** `apps/web/supabase/migrations/20260704120000_roma_audit_runs.sql`

Table `public.roma_audit_runs` with:

- Identity: `id`, `created_at`, `created_by_user_id`, `created_by_email_hash`
- Audit metadata: `mode`, `status`, `release_recommendation`, `confidence`, `coverage_percent`
- Counts: `critical_count`, `warning_count`
- Summaries (jsonb): `evidence_summary`, `findings_summary`, `recommendations_summary`
- Context: `limitations`, `source_version`, `build_sha`, `environment`
- Redacted payload: `raw_payload_redacted jsonb`
- Retention: `retention_until`

**RLS:** enabled, **no policies** (same pattern as `platform_owner_audit_log`). Service role only via server routes.

**Production migration applied:** NO (repo migration only — apply via standard Supabase deploy process).

---

## APIs

| Method | Path | Guard | Behavior |
|--------|------|-------|----------|
| `POST` | `/api/v1/platform/testing/safe-audit/save` | `write` | Server runs `createSafeReadonlyAudit()`, redacts, inserts row, logs `roma_audit_run_saved` |
| `GET` | `/api/v1/platform/testing/safe-audit/runs` | `read` | Latest 20 summary rows — **no** `raw_payload_redacted` |

Save API does **not** accept client audit JSON.

---

## UI

| Route | Purpose |
|-------|---------|
| `/[locale]/platform-admin/testing/safe-audit` | Refresh + **Save Snapshot** button |
| `/[locale]/platform-admin/testing/audit-runs` | Latest saved runs (summary columns) |

Save Snapshot copy clarifies: redacted audit evidence only, no tests, no product mutation.

---

## Redaction

- `redactAuditPayloadForStorage()` before insert
- `assertPayloadSafeForStorage()` blocks forbidden key patterns
- Email stored as hash only (`created_by_email_hash`)
- List API excludes raw payload column

---

## Limitations (V1)

1. **No auto-save** — explicit Save Snapshot only
2. **No retention job** — `retention_until` stored but purge not scheduled
3. **No compare/export** — list view only
4. **No detail page** for full redacted payload (future)
5. Migration must be applied to Supabase before save works in deployed env

---

## Validation

**Tests:** `roma-run-history.test.ts`, `roma-run-history-redaction.test.ts`, `roma-qa-center.test.ts`

```bash
bun test lib/platform-admin/roma-run-history.test.ts
bun test lib/platform-admin/roma-run-history-redaction.test.ts
```

---

## Verdict flags

| Flag | Value |
|------|-------|
| Persistence enabled in code | **YES** |
| Production migration applied | **NO** |
| `ROMA_RUN_HISTORY_V1_READY` | **YES** |
| `READY_FOR_HISTORY_DEPLOY` | **YES** (after migration apply + owner smoke) |
