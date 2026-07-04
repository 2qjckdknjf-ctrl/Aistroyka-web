# ROMA Safe Audit Run History — Design

**Date:** 2026-07-04  
**Branch:** `security/platform-admin-separation`  
**Status:** Design only — **no persistence, no migration, no API**  
**Verdict:** Ready for phased implementation after owner approval

---

## Purpose

Define how ROMA will **safely store and display Safe Readonly Audit history** after V1 refresh proved the read-only runner. Current state:

- Safe Readonly Audit V1 ✅
- Manual Refresh API (`POST /api/v1/platform/testing/safe-audit/refresh`) ✅
- No persistence ✅
- Owner-only refresh ✅
- Production mutation = NO ✅

This document specifies storage, schema, RLS, UI, write path, retention, and implementation phases — **without enabling persistence yet**.

---

## Recommended architecture

### Storage options evaluated

| Option | Verdict | Rationale |
|--------|---------|-----------|
| **Supabase table** | **Recommended** | Same project (`AISTROYKA`), existing `platform_owner_audit_log` pattern (RLS enabled, service-role writes), JSONB for redacted payload, query/compare UI, tenant isolation via RLS |
| File artifact | Reject | Cloudflare Workers / OpenNext — no durable local FS; multi-instance inconsistency |
| Object storage (R2/S3) | Defer | Good for large blobs; poor for indexed list/compare without secondary index table |
| External observability | Reject | Datadog/Sentry not suited for owner-facing structured audit history + compare |

### Recommended stack

```
Refresh/Save (owner API)
    → redactAuditPayloadForStorage()
    → insert via service role (SECURITY DEFINER function or app admin client)
    → roma_audit_runs row
    → insertPlatformOwnerAudit(action: roma_audit_run_saved)
    → History UI reads via platform owner API (never direct client Supabase)
```

**No automatic persistence.** Owner must explicitly **Save snapshot** or **Refresh and Save** (future UI).

---

## Future schema: `public.roma_audit_runs`

```sql
-- DESIGN ONLY — not applied in this phase
CREATE TABLE public.roma_audit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  created_by_email_hash text NOT NULL,
  mode text NOT NULL CHECK (mode = 'SAFE_READONLY_AUDIT'),
  status text NOT NULL CHECK (status IN ('pass', 'degraded', 'fail', 'unknown')),
  release_recommendation text NOT NULL,
  confidence text NOT NULL,
  coverage_percent smallint,
  critical_count integer NOT NULL DEFAULT 0,
  warning_count integer NOT NULL DEFAULT 0,
  evidence_summary text NOT NULL,
  findings_summary text NOT NULL,
  recommendations_summary text NOT NULL,
  limitations jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_version text NOT NULL,
  build_sha text,
  environment text NOT NULL,
  raw_payload_redacted jsonb NOT NULL,
  retention_until timestamptz NOT NULL
);

CREATE INDEX idx_roma_audit_runs_created_at ON public.roma_audit_runs (created_at DESC);
CREATE INDEX idx_roma_audit_runs_status ON public.roma_audit_runs (status, created_at DESC);
CREATE INDEX idx_roma_audit_runs_retention ON public.roma_audit_runs (retention_until);
```

TypeScript mirror: `apps/web/lib/platform-admin/roma-run-history.types.ts` → `RomaAuditRunRecord`.

---

## RLS policies (design)

Follow **`platform_owner_audit_log`** pattern: RLS enabled, **no policies for anon/authenticated** — all access via service role on server.

| Operation | Who | How |
|-----------|-----|-----|
| SELECT | Platform owner | Server route validates `requirePlatformOwnerApi`, then admin client SELECT |
| INSERT | Platform owner save action | Server-only: `insert_roma_audit_run()` SECURITY DEFINER or admin client after redaction |
| UPDATE | **Forbidden** | Append-only history — no row updates |
| DELETE | Retention job only | Service role scheduled purge where `retention_until < now()` |
| Tenant users | **Denied** | No tenant_id column; no RLS policy; not exposed on `/admin/*` |
| Public | **Denied** | Platform API guard |

Additional insert guard (application layer):

1. `requirePlatformOwnerApi({ mode: "read" })` for save (read-tier sufficient — append-only metadata)
2. Explicit `saveIntent` in request body
3. Redaction pass mandatory before insert
4. `insertPlatformOwnerAudit` with `action: "roma_audit_run_saved"`, `entity_id: run.id`

---

## Security model

| Requirement | Design |
|-------------|--------|
| Platform owner only | API + page under `/platform-admin/*`; `requirePlatformOwnerApi` |
| No tenant admin | No `/admin/testing` route; no tenant RLS path |
| No secrets in storage | `redactAuditPayloadForStorage()` strips emails, tokens, keys, JWTs, connection strings |
| No raw tokens | Forbidden key list in `ROMA_AUDIT_RUN_FORBIDDEN_STORAGE_KEYS` |
| No PII unless unavoidable | Store `created_by_email_hash` (SHA-256 prefix), not raw email |
| Safe evidence redaction | Regex redaction + `[REDACTED]` mask; `redaction` meta in payload |
| No production mutation | Save is INSERT-only to audit table; no deploy/CI/flag changes |
| Audit trail | Link to `platform_owner_audit_log` on every save |

---

## Data retention

| Policy | Value |
|--------|-------|
| Default retention | **90 days** (`ROMA_AUDIT_RUN_RETENTION_DAYS`) |
| Purge | Scheduled job deletes rows where `retention_until < now()` |
| Anonymize before purge | Optional: null `raw_payload_redacted` 7 days before delete; keep summary columns |
| Owner export | Future: JSON download before purge (owner-gated) |
| Legal hold | Future: `retention_until` override flag (owner-only, out of scope V1) |

What to purge: full row after retention.  
What to keep in platform_owner_audit_log: save action metadata indefinitely (lighter weight).

---

## UI model (future)

**Route recommendation:** `/[locale]/platform-admin/testing/audit-runs`  
*(Note: existing ROMA nav item `History` is a static placeholder — repurpose or add sibling `Audit Runs` to avoid confusion.)*

### List view

| Column | Source |
|--------|--------|
| Timestamp | `created_at` |
| Status | `status` badge |
| Release | `release_recommendation` |
| Confidence | `confidence` |
| Coverage | `coverage_percent` |
| Critical / Warning | counts |
| Environment | `environment` |
| Build | `build_sha` |

### Detail view

- Full redacted payload
- Evidence / findings / recommendations tabs
- Limitations + forbidden actions reminder
- Link to source auditId

### Compare view

- Select two runs → `RomaAuditRunComparison`
- Highlight status/release/confidence deltas
- New vs resolved finding titles

### Save controls (future — not in refresh-only V1)

| Button | Behavior |
|--------|----------|
| **Save snapshot** | Persist current in-memory audit |
| **Refresh and Save** | `POST refresh` → redact → insert |

**Not allowed:** Run Full Audit, Execute, Deploy, Fix, Enable feature.

---

## Safe write path

```
1. Owner clicks "Save snapshot" or "Refresh and Save"
2. POST /api/v1/platform/testing/safe-audit/save  (future)
3. requirePlatformOwnerApi(request, { mode: "read" })
4. If refresh_and_save: buildSafeReadonlyAuditRefreshResponse()
   Else: validate client-provided audit snapshot hash / server-side re-fetch optional
5. redactAuditPayloadForStorage(audit)
6. buildAuditRunRecordDraft({ audit, userId, emailHash, environment, buildSha })
7. admin.from("roma_audit_runs").insert(draft)  — service role only
8. insertPlatformOwnerAudit({ action: "roma_audit_run_saved", entity_id: id })
9. Return { data: { runId, createdAt } }
```

**V1 refresh remains ephemeral.** Save is a separate explicit action requiring owner approval in a future PR.

---

## TypeScript design artifacts (no persistence)

| File | Role |
|------|------|
| `roma-run-history.types.ts` | Schema types, list/compare models |
| `roma-run-history-redaction.ts` | Redaction + summary + draft builder |
| `roma-run-history-redaction.test.ts` | Redaction model tests only |

---

## Risks

| Risk | Mitigation |
|------|------------|
| Secret leakage in probe detail | Mandatory redaction pass; forbid raw env in payload |
| Tenant data in probes | Probes are platform-level only; no tenant_id in schema |
| Unbounded storage | 90-day retention + summary-only option |
| Automatic save without consent | Explicit save button; no hook on refresh in V1 |
| Owner email in logs | Hash only in `roma_audit_runs` |
| Compare misleading | Compare finding titles only; link to full redacted payload |

---

## Implementation phases

| Phase | Scope | Gate |
|-------|-------|------|
| **0 — Design** | This document + types/redaction | ✅ Complete |
| **1 — Migration** | `roma_audit_runs` table + indexes + RLS (no policies) | Owner approval |
| **2 — Save API** | `POST .../safe-audit/save` + audit log linkage | Phase 1 + redaction tests |
| **3 — History UI** | `/platform-admin/testing/audit-runs` list + detail | Phase 2 |
| **4 — Compare + export** | Two-run diff + JSON download | Phase 3 |
| **5 — Retention job** | Scheduled purge + optional pre-purge anonymize | Phase 1 + ops approval |

---

## Verdict flags

| Flag | Value |
|------|-------|
| `ROMA_RUN_HISTORY_DESIGN_READY` | **YES** |
| `PERSISTENCE_ENABLED` | **NO** |
| `READY_FOR_RUN_HISTORY_IMPLEMENTATION` | **YES** |

---

## Related docs

- `docs/audits/ROMA_SAFE_READONLY_AUDIT_V1_REPORT.md`
- `docs/audits/ROMA_SAFE_AUDIT_MANUAL_REFRESH_REPORT.md`
- `apps/web/supabase/migrations/20260428120000_platform_owner_roles_audit.sql` (audit log precedent)
