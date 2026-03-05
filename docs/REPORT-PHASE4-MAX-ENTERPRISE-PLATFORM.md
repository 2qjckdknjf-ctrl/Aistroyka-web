# Phase 4 — Maximum Enterprise Platform: Report

**Project:** AISTROYKA.AI  
**Stack:** Next.js 14 + OpenNext + Cloudflare Workers + Supabase + OpenAI  
**Clients:** Web Manager, iOS Full/Lite, Android Full/Lite (future)

---

## 1. Offline-first sync engine

**Tables:** `sync_cursors` (tenant_id, user_id, device_id, cursor, updated_at), `change_log` (id bigserial, tenant_id, resource_type, resource_id, change_type, changed_by, ts, payload). RLS enforces tenant isolation.

**Contracts:** Sync schemas in `packages/contracts/src/schemas/sync.schema.ts`. OpenAPI includes GET /api/v1/sync/bootstrap, GET /api/v1/sync/changes?cursor=&limit=, POST /api/v1/sync/ack.

**Conflict policy:** Server-authoritative for task assignments and approvals; last-write-wins for draft notes (version field); 409 + conflict payload when merge is not safe. See docs/SYNC-CONFLICT-POLICY.md.

**Emission:** Every domain write (report create/submit, upload-session create/finalize) emits a change_log record via change-log.service. Payload minimal, no secrets.

---

## 2. Real-time strategy

**Choice:** Supabase Realtime (Postgres changes). No long-lived processes; fits Cloudflare-first and existing Supabase usage.

**Channels:** tenant:{tenantId}, project:{projectId} (documented). Tables: jobs, worker_reports, upload_sessions, task_assignments. Events: job_events, report status, upload_sessions status, task assignment changes.

**Implementation:** `apps/web/lib/realtime/tenant-realtime.ts` — subscribeTenantRealtime(supabase, tenantId, callbacks). Backend readiness and contracts; minimal client hooks.

**ADR:** 021-realtime-supabase.md.

---

## 3. Durable queue design

**Option chosen:** DB-backed queue with strict concurrency control and idempotent enqueue (dedupe_key). Cloudflare Queues/DO not in current wrangler config; DB path implemented with fallback documented.

**Provider abstraction:** `apps/web/lib/platform/jobs/queue/` — queue.interface.ts, queue.db.ts, queue.service.ts. Idempotent enqueue via dedupe_key; job handlers idempotent; at-least-once safe.

**Tenant concurrency:** `tenant_concurrency` (tenant_id, jobs_running, max_jobs_running). try_acquire_job_slot / release_job_slot enforce cap; processJobs respects it.

**ADR:** 022-durable-queue-db-concurrency.md.

---

## 4. AI governance

**Policy engine:** policy.types, policy.rules (tier, max image size/count), policy.service (runPolicy, checkPolicy, recordPolicyDecision), redaction.service (regex email/phone), model-routing.service (FREE → cheaper, PRO/ENTERPRISE → best + fallback).

**Persistence:** ai_policy_decisions (tenant_id, trace_id, decision, rule_hits, created_at). All AI calls run policy check and record decision; metrics emitted.

**Redaction:** Placeholder only: regex remove emails/phones, mask identifiers; log redaction in audit/metrics. No heavy NLP.

**ADR:** 023-ai-governance-policy-engine.md.

---

## 5. SLO/SLA and error budgets

**SLOs (configurable):** API availability (e.g. 99.9%), p95 latency (worker, sync, media), job success rate, AI analysis success rate.

**Tables:** slo_daily (tenant_id, date, endpoint_group, requests, errors, p95_latency_ms), alerts (id, tenant_id, severity, type, message, created_at, resolved_at).

**Services:** slo.service (getSloDaily), error-budget.service (consumedErrorBudget), alert.service (createAlert, listAlerts). Admin: GET /api/v1/admin/slo/overview?range=30d, GET /api/v1/admin/slo/tenants/:tenantId?range=30d.

**Alert generation:** SLO breach for 2 consecutive windows; AI cost spike; job failure spike. No external alerting by default.

**ADR:** 024-slo-error-budgets-alerts.md, 030-slo-alert-generation.md.

---

## 6. Retention enforcement

**Job:** retention-cleanup handler. Uses data_retention_policies; sets archived_at on upload_sessions (no hard-delete by default). Archive state option; storage object delete only if policy allows.

**Audit:** All retention actions logged (audit_logs). Safety: archive-first; no hard-delete for enterprise by default.

**ADR:** 025-retention-enforcement.md, 031-retention-safety-archive-first.md.

---

## 7. Data residency (foundation)

**Table:** tenant_settings (tenant_id pk, data_residency, created_at). Metadata only (e.g. EU/US). Used in governance and docs; no multi-db implementation.

**ADR:** 026-data-residency-foundation.md.

---

## 8. Security hardening

**Request size:** Strict limit (1 MB) on media upload-sessions and finalize; 413 when exceeded.

**Auth/login:** Stricter rate limits and audit (Phase 3). Job processing endpoint protected (jobs:process + tenant scope).

**Debug:** DEBUG_* and ALLOW_DEBUG_HOSTS required; debug routes return 404 when not allowed.

**CSRF:** Same-site cookies; tokens for risky actions if needed. Documented in SECURITY-CSRF.md. Security headers verification test added.

**ADR:** 027-security-hardening-phase4.md.

---

## 9. Mobile integration summary

**Guide:** docs/MOBILE-INTEGRATION-GUIDE.md. iOS Full/Lite, Android: auth, sync (bootstrap/changes/ack), idempotency (x-idempotency-key), x-device-id, conflict policy, optional realtime.

**SDK:** packages/api-client (TS) with sync methods; OpenAPI includes sync, realtime event types (doc), idempotency headers and error shapes. Mobile: OpenAPI Generator (Swift/Kotlin).

**ADR:** 028-sdk-mobile-guide.md.

---

## 10. Risk map and Phase 5 roadmap

**Risks:** (1) SLO aggregation depends on middleware/batch to fill slo_daily — ensure instrumentation. (2) Retention must align with tenant policies and legal. (3) Multi-region split not implemented — data residency is metadata only.

**Phase 5 (candidate):** Multi-region DB/storage split; external alerting (PagerDuty/Slack); advanced AI redaction; mobile E2E in CI; SDK versioning (v2 where breaking).

---

## ADR index (Phase 4)

- 020 Sync engine offline-first  
- 021 Realtime Supabase  
- 022 Durable queue DB + concurrency  
- 023 AI governance policy engine  
- 024 SLO / error budgets / alerts  
- 025 Retention enforcement  
- 026 Data residency foundation  
- 027 Security hardening  
- 028 SDK and mobile guide  
- 029 Idempotency and conflict policy  
- 030 SLO alert generation  
- 031 Retention safety archive-first  

---

## Deliverables checklist

- [x] Sync engine (bootstrap, changes, ack); conflict policy doc  
- [x] Real-time strategy and backend readiness  
- [x] Durable queue path (DB + concurrency); idempotent enqueue  
- [x] AI governance policy engine; redaction; model routing  
- [x] SLO stats + alerts table and admin endpoints  
- [x] Retention job (archive-first); audit  
- [x] tenant_settings data residency  
- [x] Security hardening (size limit, CSRF doc, headers test)  
- [x] MOBILE-INTEGRATION-GUIDE.md; OpenAPI/sync contracts  
- [x] Tests: sync cursor/deltas, policy block/degrade, job idempotency, error budget, SLO service  
- [x] REPORT-PHASE4; ADRs 020–031  
