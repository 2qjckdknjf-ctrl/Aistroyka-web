# ROMA Run History Implementation V1 Report

**Date:** 2026-07-05  
**Branch:** `security/platform-admin-separation`  
**Commits:** `e31af243` (feature), `e6170ceb` (client-safe deploy fix)  
**Supabase project:** `vthfrxehrursfloevnlp` (AISTROYKA, eu-central-1)  
**Verdict:** Migration applied; app deployed to production/staging; owner UI smoke pending Cloudflare Access session

---

## Migration

**File:** `apps/web/supabase/migrations/20260704120000_roma_audit_runs.sql`  
**Remote applied:** `20260705101054` / name `roma_audit_runs` (via Supabase MCP apply_migration)

Table `public.roma_audit_runs` with:

- Identity: `id`, `created_at`, `created_by_user_id`, `created_by_email_hash`
- Audit metadata: `mode`, `status`, `release_recommendation`, `confidence`, `coverage_percent`
- Counts: `critical_count`, `warning_count`
- Summaries (jsonb): `evidence_summary`, `findings_summary`, `recommendations_summary`
- Context: `limitations`, `source_version`, `build_sha`, `environment`
- Redacted payload: `raw_payload_redacted jsonb`
- Retention: `retention_until`

**RLS:** enabled (`relrowsecurity = true`), **zero policies** (service-role-only; same pattern as `platform_owner_audit_log`).

**Direct access validation (2026-07-05):**

| Actor | Operation | Result |
|-------|-----------|--------|
| `anon` (REST) | `SELECT` | HTTP 200, `[]` (no rows visible) |
| `anon` (REST) | `INSERT` | HTTP 401, `42501` RLS violation |
| Authenticated tenant | Platform APIs | Blocked at app layer (see Security) |

---

## Deploy

| Environment | Host | `buildStamp.sha7` | Deploy run |
|-------------|------|-------------------|------------|
| Staging | `staging.aistroyka.ai` | `e6170ce` | GH Actions `28737420975` ✅ |
| Production | `aistroyka.ai` / `admin.aistroyka.ai` | `e6170ce` | GH Actions `28737528557` ✅ |

**Deploy fix (`e6170ceb`):** Extracted `ROMA_AUDIT_RUN_HISTORY_META` to `roma-run-history.constants.ts` so client components do not import `node:crypto` via the server service/redaction chain (resolved staging `cf:build` failure).

Local gate: `bun run cf:build` ✅ (2026-07-05).

---

## APIs

| Method | Path | Guard | Behavior |
|--------|------|-------|----------|
| `POST` | `/api/v1/platform/testing/safe-audit/save` | `requirePlatformOwnerApi({ mode: "write" })` | Server runs `createSafeReadonlyAudit()`, redacts, inserts row, logs `roma_audit_run_saved` |
| `GET` | `/api/v1/platform/testing/safe-audit/runs` | `requirePlatformOwnerApi({ mode: "read" })` | Latest 20 summary rows — **`LIST_COLUMNS` excludes `raw_payload_redacted`** |

Save API does **not** accept client audit JSON.

**Live unauthenticated probes (production + staging, 2026-07-05):**

- `POST .../safe-audit/save` → **403**
- `GET .../safe-audit/runs` → **403**
- `POST .../admin/testing/safe-audit/save` (tenant path) → **404**

---

## UI

| Route | Purpose |
|-------|---------|
| `/[locale]/platform-admin/testing/safe-audit` | Refresh + **Save Snapshot** button |
| `/[locale]/platform-admin/testing/audit-runs` | Latest saved runs (summary columns) |

**Owner smoke (`admin.aistroyka.ai`):** Perimeter Cloudflare Access returns **302** to login for unauthenticated requests. End-to-end Save Snapshot → audit-runs list **not executed in this deploy pass** (requires operator Access + platform-owner session). Table row count remains **0** until owner completes smoke.

---

## Redaction

- `redactAuditPayloadForStorage()` before insert
- `assertPayloadSafeForStorage()` blocks forbidden key patterns
- Email stored as hash only (`created_by_email_hash`)
- List API excludes raw payload column (verified in `roma-run-history.test.ts`)

---

## Tests

```bash
bun test lib/platform-admin/roma-run-history.test.ts
bun test lib/platform-admin/roma-run-history-redaction.test.ts
```

**Result:** 19/19 pass (2026-07-05).

---

## Production health

`GET https://aistroyka.ai/api/v1/health` → `ok: true`, `db: ok`, `buildStamp.sha7: e6170ce`.

---

## Verdict flags

| Flag | Value |
|------|-------|
| `ROMA_HISTORY_MIGRATION_APPLIED` | **YES** |
| `ROMA_HISTORY_APP_DEPLOYED` | **YES** (`e6170ce` on staging + production) |
| `SAVE_SNAPSHOT_OK` | **NO** (owner Access smoke not run; 0 rows in `roma_audit_runs`) |
| `AUDIT_RUNS_LIST_OK` | **NO** (depends on Save Snapshot smoke) |
| `RAW_PAYLOAD_NOT_EXPOSED` | **YES** (code + tests; list API column exclusion; unauth 403 live) |
| `TENANT_ACCESS_BLOCKED` | **YES** (403 platform APIs; 404 tenant path; RLS denies anon insert) |
| `PRODUCTION_HEALTH` | **HEALTHY** |

---

## Owner follow-up (manual)

1. Log in via Cloudflare Access on `https://admin.aistroyka.ai`
2. Open `/ru/platform-admin/testing/safe-audit` → **Save Snapshot** → confirm success toast/response
3. Open `/ru/platform-admin/testing/audit-runs` → confirm run appears
4. DevTools: `GET /api/v1/platform/testing/safe-audit/runs` response must **not** contain `raw_payload_redacted`

After smoke: set `SAVE_SNAPSHOT_OK` / `AUDIT_RUNS_LIST_OK` to **YES** in this report.
