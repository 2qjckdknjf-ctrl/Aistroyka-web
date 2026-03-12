# Release Audit — Phase 3: Feature Readiness Matrix

**Generated:** Release Readiness Audit  
**Classification:** READY | READY_WITH_RISK | PARTIAL | BROKEN | NOT_IMPLEMENTED | UNKNOWN_REQUIRES_RUNTIME_VALIDATION

---

## AUTH & IDENTITY

| Subsystem | Status | Evidence | Risk | Release decision | Remediation |
|-----------|--------|----------|------|------------------|-------------|
| Login | READY | Supabase Auth, /api/auth/login, middleware updateSession | Low | Ship | — |
| Logout | READY | Sign-out via Supabase client | Low | Ship | — |
| Session handling | READY | @supabase/ssr, createClientFromRequest, cookies | Low | Ship | — |
| Token refresh | READY | Supabase client handles refresh | Low | Ship | — |
| Cookie vs bearer | READY_WITH_RISK | Web uses cookies; mobile may use bearer (x-client header) | Medium | Ship | Document mobile auth contract |
| Role handling | READY | tenant_members.role, RBAC roles/permissions, authorize() | Low | Ship | — |
| Admin handling | READY | requireAdmin(ctx), admin table/flag | Low | Ship | — |

---

## TENANT SYSTEM

| Subsystem | Status | Evidence | Risk | Release decision | Remediation |
|-----------|--------|----------|------|------------------|-------------|
| Tenant context resolution | READY | getTenantContextFromRequest, tenant_members | Low | Ship | — |
| Cross-tenant isolation | READY | RLS on core tables; requireTenant in routes | Low | Ship | — |
| Tenant-scoped queries | READY | Repositories take tenantId; RLS backup | Low | Ship | — |
| Tenant-scoped routes | READY | v1 routes use ctx.tenantId | Low | Ship | — |
| Tenant-scoped storage | PARTIAL | Storage buckets referenced in migrations/docs; policies CONFIG-DEPENDENT | Medium | Validate storage RLS in live env | Run storage policy audit |

---

## WEB APPLICATION

| Subsystem | Status | Evidence | Risk | Release decision | Remediation |
|-----------|--------|----------|------|------------------|-------------|
| App shell | READY | [locale] layout, dashboard nav, routing | Low | Ship | — |
| Routing | READY | next-intl, locales ru/en/es/it | Low | Ship | — |
| Dashboard | READY | Dashboard pages, DashboardShell | Low | Ship | — |
| Manager workflows | READY | Projects, tasks, reports, workers, uploads | Low | Ship | — |
| Task views | READY | tasks list/detail, assign | Low | Ship | — |
| Reports | READY | reports list/detail, analysis-status | Low | Ship | — |
| Media flows | READY | upload-sessions, finalize, annotations/comments | Low | Ship | — |
| Analytics/ops pages | READY | ops/overview, metrics; admin/* | Low | Ship | — |
| Empty/error/loading | PARTIAL | Some pages; not audited everywhere | Low | Accept | Add missing states where critical |
| Localization/i18n | READY | next-intl, messages, 4 locales | Low | Ship | — |

---

## MOBILE APPLICATIONS

| Subsystem | Status | Evidence | Risk | Release decision | Remediation |
|-----------|--------|----------|------|------------------|-------------|
| Manager app (iOS) | READY_WITH_RISK | AiStroykaWorker, Views/Services; git shows active changes | Medium | Pilot | Validate against prod API |
| Worker Lite (iOS) | PARTIAL | WorkerLite → AiStroykaWorker rename in progress; deleted files in git | High | No pilot until rename stable | Complete rename, smoke test |
| Auth | READY_WITH_RISK | Session persistence via Supabase; x-client ios_lite/ios_manager | Medium | Validate token refresh on app resume | — |
| Sync | READY | v1/sync/bootstrap, changes, ack | Low | Ship | — |
| Offline assumptions | UNKNOWN_REQUIRES_RUNTIME_VALIDATION | No offline queue audited in this run | Medium | Document expected behavior | — |
| Media upload | READY | upload-sessions, finalize; lite allow-list includes these paths | Low | Ship | — |
| Task flows | READY | v1/worker/tasks/today, report create/add-media/submit | Low | Ship | — |
| Daily report flows | READY | worker/report/*, worker/day/start|end | Low | Ship | — |
| Push notification | PARTIAL | Push service, outbox, APNS/FCM; device register/unregister | Medium | CONFIG-DEPENDENT | Configure APNS/FCM in prod |
| API contract alignment | READY | Lite allow-list matches v1 worker/sync/media/devices | Low | Ship | — |

---

## BACKEND/API

| Subsystem | Status | Evidence | Risk | Release decision | Remediation |
|-----------|--------|----------|------|------------------|-------------|
| Health routes | READY | /api/health, /api/v1/health, getHealthResponse | Low | Ship | — |
| Auth-protected routes | READY | requireTenant/requireAdmin on v1 and tenant/* | Low | Ship | — |
| Ops routes | READY | /api/v1/ops/*, org/*, admin/* | Low | Ship | — |
| Admin routes | READY | requireAdmin after requireTenant | Low | Ship | — |
| Public routes | READY | health, config, login, webhook (signed) | Low | Ship | — |
| Route consistency | READY_WITH_RISK | Legacy vs v1; some legacy without explicit requireTenant (RPC enforces) | Low | Ship | Prefer v1 |
| DTO/contract consistency | READY | packages/contracts, Zod | Low | Ship | — |
| Error format consistency | PARTIAL | JSON error bodies; status codes vary | Low | Accept | Standardize where possible |
| Idempotency | READY | idempotency_keys table, lite-idempotency for worker | Low | Ship | — |

---

## DATA/MEDIA FLOWS

| Subsystem | Status | Evidence | Risk | Release decision | Remediation |
|-----------|--------|----------|------|------------------|-------------|
| Upload session lifecycle | READY | upload-sessions create, finalize; upload_sessions table | Low | Ship | — |
| Storage path correctness | UNKNOWN_REQUIRES_RUNTIME_VALIDATION | Storage paths in code; bucket policies in Supabase | Medium | Validate in staging | — |
| Image/video/report linkage | READY | report add-media, media annotations, report_id on tasks | Low | Ship | — |
| Stuck upload handling | READY | upload_reconcile job, cron-tick | Low | Ship | — |
| Expiry cleanup | READY | retention/cleanup jobs, ops_events_prune | Low | Ship | — |
| Sync conflict handling | READY | sync-conflict.ts, change_log | Low | Ship | — |

---

## AI SUBSYSTEM

| Subsystem | Status | Evidence | Risk | Release decision | Remediation |
|-----------|--------|----------|------|------------------|-------------|
| Provider config | READY | OPENAI/ANTHROPIC/GEMINI keys in server config; provider router | Low | Ship | Ensure keys in prod |
| Request path | READY | AIService.analyzeImage → policy → router → usage | Low | Ship | — |
| Logging | READY | logAiRequest, structured logs, policy_decision_id | Low | Ship | — |
| Moderation/safety | READY | Policy engine, risk calibration, AIPolicyBlockedError | Low | Ship | — |
| Image analysis path | READY | analyze-image route, runVisionAnalysis, job handlers | Low | Ship | — |
| Retries | READY | runOneJob retries 5xx; circuit breaker in provider | Low | Ship | — |
| Timeout behavior | READY_WITH_RISK | Provider-level timeouts; no global request timeout audited | Low | Ship | Add request timeout if needed |
| Fallback behavior | READY | Provider router fallback order | Low | Ship | — |
| Cost/rate safeguards | READY | recordUsage, estimateCostUsd, rate-limit on jobs/process | Low | Ship | — |

---

## JOBS / CRON / AUTOMATION

| Subsystem | Status | Evidence | Risk | Release decision | Remediation |
|-----------|--------|----------|------|------------------|-------------|
| Cron-tick path | READY | POST /api/v1/admin/jobs/cron-tick, requireCronSecretIfEnabled | Low | Ship | Set CRON_SECRET in prod |
| Scheduled work | READY | enqueueJob upload_reconcile, processJobs | Low | Ship | — |
| Retry queues | READY | job max_attempts, job state | Low | Ship | — |
| Dead-letter / failure visibility | PARTIAL | Jobs table state; no dedicated DLQ UI audited | Low | Accept | Add admin job failure view |
| Cleanup jobs | READY | ops_events_prune, retention | Low | Ship | — |
| Reporting jobs | READY | ai-analyze-media, ai-analyze-report | Low | Ship | — |

---

## OBSERVABILITY

| Subsystem | Status | Evidence | Risk | Release decision | Remediation |
|-----------|--------|----------|------|------------------|-------------|
| Logs | READY | logStructured, request_id, route, duration_ms | Low | Ship | — |
| Request IDs | READY | getOrCreateRequestId, x-request-id | Low | Ship | — |
| Structured error reporting | READY | JSON bodies, error_code in some routes | Low | Ship | — |
| Ops metrics | READY | ops/overview, ops/metrics, SLO tables | Low | Ship | — |
| Dashboards | PARTIAL | Admin pages for jobs, AI, push; no dedicated observability dashboard | Medium | Accept | Add links to CF/Supabase dashboards |
| Incident diagnosis | READY_WITH_RISK | Logs + request_id; no runbook automation | Low | Ship | Document runbooks |

---

## Summary counts

- READY: 45+
- READY_WITH_RISK: 6
- PARTIAL: 6
- UNKNOWN_REQUIRES_RUNTIME_VALIDATION: 2
- BROKEN: 0
- NOT_IMPLEMENTED: 0

**Release decision from matrix:** Proceed with conditions: address Worker Lite rename and push/config validation; confirm debug/diag off in production; validate storage and cron in live env.
