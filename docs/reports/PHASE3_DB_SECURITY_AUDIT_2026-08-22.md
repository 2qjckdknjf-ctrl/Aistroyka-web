# Phase 3 — DB & Security Certification Audit

**Date:** 2026-08-22  
**Project:** AISTROYKA (`vthfrxehrursfloevnlp`, eu-central-1)  
**Baseline:** `origin/main` @ `a7144249`  
**Status:** **IN PROGRESS**

---

## 1. Migration parity summary

| Metric | Value |
|--------|-------|
| Repo migration files | 154 |
| Remote migration records | 158 (+2 applied this session) |
| Version-timestamp skew | **EXPECTED** — MCP/dashboard apply uses different version IDs than repo filenames for equivalent SQL |

### Name-based reconciliation (logical)

Most drift is **timestamp skew** (same SQL, different `schema_migrations.version`). True gaps identified:

| Gap | Direction | Action | Status |
|-----|-----------|--------|--------|
| `media_file_url_immutable_for_clients` | Repo → remote | Apply security trigger | **PROVEN** live 2026-08-22 |
| `jobs_payload_project_tenant_check` | Repo → remote | Apply tenant guard trigger | **PROVEN** live 2026-08-22 |
| `021_saved_places` | Remote → repo | Reconciliation migration needed | **OPEN** |
| `022_protected_day_events` | Remote → repo | Reconciliation migration needed | **OPEN** |

### Live verification (post-apply)

```sql
-- Triggers present on production:
-- media_file_url_immutable_trg ON media
-- jobs_payload_project_tenant_trg ON jobs
```

---

## 2. Remote-only tables (not in repo)

| Table | Columns (summary) | RLS | Notes |
|-------|-------------------|-----|-------|
| `saved_places` | user_id, name, place_type, lat/lon, timezone | Yes (owner policies) | Personal/geo feature — reconcile into repo |
| `protected_day_events` | user_id, profile_id, event_type, event_date | Yes (owner policies) | Personal calendar feature — reconcile into repo |

**Risk:** Schema exists in production without repo source-of-truth → future deploys/migrations may drift.

---

## 3. Security hardening applied (2026-08-22)

| Control | Purpose | Live |
|---------|---------|------|
| `media_protect_file_url()` | Block non-service_role `media.file_url` mutation | **PROVEN** |
| `jobs_protect_payload_project_tenant()` | Reject cross-tenant `jobs.payload.project_id` | **PROVEN** |

Repo files (already present):
- `20260806210000_media_file_url_immutable_for_clients.sql`
- `20260807090000_jobs_payload_project_tenant_check.sql`

---

## 4. RLS / tenant isolation tests

| Area | Status |
|------|--------|
| Negative integration tests (Tenant A ≠ Tenant B) | **NOT TESTED** — Phase 3 next slice |
| Open security PR queue (#208–#222) | **NOT MERGED** — review backlog |

---

## 5. Web/API security

| Check | Status |
|-------|--------|
| Secret scan | **NOT RUN** this session |
| IDOR / platform-admin separation | **NOT TESTED** this session |
| Auth recovery (Phase 2 PR #229) | **PENDING MERGE** |

---

## 6. Blockers

| Blocker | Type |
|---------|------|
| Repo reconciliation for `saved_places` / `protected_day_events` | Phase 3 in-scope |
| RLS negative test suite | Phase 3 in-scope |
| 30 open `cursor/critical-bug-investigation-*` PRs | Merge queue |

---

## 7. Closure verdict

**NO** — security triggers now live; migration repo parity and RLS negative tests remain.

**Next slice:** add reconciliation migrations for remote-only tables; expand tenant isolation negative tests; secret scan.

---

*Evidence recorded by 100% Readiness execution — Phase 3 start.*
