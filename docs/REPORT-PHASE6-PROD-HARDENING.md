# Phase 6 — Production Hardening + Observability + Release Gates

**Date:** 2026-03-06  
**Scope:** apps/web — request id, structured logging, job/AI/sync/upload telemetry, CI gates, security/perf pass.

---

## Baseline (Stage 0)

**Logging:** `lib/observability/logger.ts` — `logStructured(payload)` writes JSON to console (event, traceId, tenantId, userId, route, status, duration_ms, error_type). Skipped in test env. No PII.

**Request ID:** `lib/observability/trace.ts` — `getOrCreateTraceId(request)` reads `x-request-id` or generates UUID. Used in tenant context as `traceId`. Not set on API responses; no middleware injection for API.

**Job processing:** `app/api/analysis/process/route.ts` uses getOrCreateTraceId + logStructured. `lib/ai/runOneJob.ts` has console.log; optional traceId in job logs.

**AI logs:** `lib/platform/ai/ai.service.ts` and providers use console.log; policy/audit in `ai_policy_decisions`.

**Cockpit overview:** `DashboardOpsOverviewClient` → GET `/api/v1/ops/overview` → `lib/ops/ops-overview.repository.ts` `getOpsOverview()` (Supabase: projects, worker_day, worker_reports, upload_sessions, jobs, push_outbox).

---

## Stage 1 — Request ID + Structured Logging

_(To fill.)_

---

## Stage 2 — Job Telemetry

_(To fill.)_

---

## Stage 3 — AI Telemetry

_(To fill.)_

---

## Stage 4 — Sync/Upload Telemetry

_(To fill.)_

---

## Stage 5 — Release Gates (CI)

_(To fill.)_

---

## Stage 6 — Security/Perf Quick Pass

_(To fill.)_

---

## Verification

- How to verify request_id on responses.
- How to run tests and cf:build.
- Known follow-ups (Phase 7).
