# Functionality Status Report

**Classification:** WORKING | PARTIALLY_IMPLEMENTED | BROKEN | NOT_IMPLEMENTED  
**Basis:** Code presence, route wiring, service usage, tests, and dependencies.

---

## 1. Authentication

| Component | Status | Evidence |
|-----------|--------|----------|
| Supabase Auth (login/register) | **WORKING** | Server client + cookies via @supabase/ssr; middleware updateSession; login/register pages and actions. |
| Session refresh / middleware | **WORKING** | updateSession in lib/supabase/middleware; protected paths redirect to login. |
| Auth diagnostic | **PARTIALLY_IMPLEMENTED** | /api/_debug/auth, /api/health/auth exist; intended for dev/diag only. |
| Tenant membership resolution | **WORKING** | getTenantContextFromRequest uses tenants + tenant_members; role and scopes loaded. |

**Overall:** WORKING for web app auth and tenant resolution.

---

## 2. Tenant System

| Component | Status | Evidence |
|-----------|--------|----------|
| Tenant context from request | **WORKING** | tenant.context.ts; used across v1 routes. |
| requireTenant / authorize | **WORKING** | tenant.guard, tenant.policy; RBAC scopes (authz.service). |
| Tenant CRUD / org | **PARTIALLY_IMPLEMENTED** | tenant.repository, tenant.service; org.repository; invite/accept/members/revoke routes. Full org UI may be partial. |
| Multi-tenant data isolation | **WORKING** | Queries filter by tenant_id; repositories take tenantId. |

**Overall:** WORKING for context and isolation; PARTIALLY_IMPLEMENTED for full org/tenant management UX.

---

## 3. API Routes (v1 and legacy)

| Area | Status | Evidence |
|------|--------|----------|
| Health | **WORKING** | GET /api/health, /api/v1/health; contract validated; tests. |
| Config | **WORKING** | GET /api/v1/config returns flags, limits, clientProfile, serverTime. |
| Projects (list/create) | **WORKING** | GET/POST /api/v1/projects use project.service; tenant-scoped. |
| Projects (by id, upload, jobs, poll, media trigger) | **PARTIALLY_IMPLEMENTED** | Routes exist under /api/projects/[id] and /api/v1; some under legacy path; poll-status and trigger wired. |
| AI analyze-image | **WORKING** | POST /api/ai/analyze-image and /api/v1/ai/analyze-image; rate-limit, quota, OpenAI call, usage recording. Bypasses Provider Router (architectural gap). |
| Jobs process | **WORKING** | POST /api/v1/jobs/process; requireTenant, authorize(jobs:process), rate-limit, processJobs(admin). |
| Sync bootstrap/changes/ack | **WORKING** | Routes exist; bootstrap has direct DB in route (refactor needed). |
| Media upload-sessions | **WORKING** | POST create + finalize; use upload-session.service. |
| Worker (tasks/today, day start/end, report create/add-media/submit, sync) | **WORKING** | Routes call domain services (task, worker-day, report). |
| Worker base GET/POST | **PARTIALLY_IMPLEMENTED** | Return 501 stub. |
| Devices register/unregister | **WORKING** | Routes exist; push.service / device tokens. |
| Billing (checkout, portal, webhook) | **PARTIALLY_IMPLEMENTED** | Routes exist; Stripe optional (getAdminClient pattern); webhook handler in billing. |
| Admin (ai/usage, alerts, analytics, audit-logs, exports, flags, jobs, metrics, anomalies, privacy, push/test, security, slo, tenants) | **PARTIALLY_IMPLEMENTED** | Many routes; some may return stub or depend on migrations/features not fully deployed. |
| Tenant invite/members/invitations/accept/revoke | **WORKING** | Routes call tenant/org logic. |
| SCIM | **PARTIALLY_IMPLEMENTED** | /api/v1/scim/[...path] proxy; identity layer has stubs. |
| Reports analysis-status | **WORKING** | Route exists for report analysis status. |

**Overall:** Core v1 (health, config, projects, ai, jobs, sync, media, worker, devices, tenant) are WORKING; admin/billing/SCIM PARTIALLY_IMPLEMENTED.

---

## 4. Worker Endpoints

| Endpoint | Status |
|----------|--------|
| GET /api/v1/worker/tasks/today | **WORKING** |
| POST /api/v1/worker/day/start, day/end | **WORKING** |
| POST /api/v1/worker/report/create, add-media, submit | **WORKING** |
| POST /api/v1/worker/sync | **WORKING** |
| GET/POST /api/v1/worker | **PARTIALLY_IMPLEMENTED** (501 stub) |

---

## 5. AI Endpoints and Pipeline

| Component | Status | Evidence |
|-----------|--------|----------|
| POST /api/v1/ai/analyze-image | **WORKING** | Implemented; direct OpenAI; rate-limit, quota, usage. |
| Async AI (job handlers) | **WORKING** | ai-analyze-media, ai-analyze-report handlers; use runVisionAnalysis (OpenAI direct). |
| Policy Engine / Provider Router | **PARTIALLY_IMPLEMENTED** | Code exists; not used by analyze-image route or runVisionAnalysis. |
| AI usage recording | **WORKING** | recordUsage in route and in runVisionAnalysis path. |

---

## 6. Image Analysis

| Component | Status |
|-----------|--------|
| Construction vision (stage, completion %, risk, issues) | **WORKING** |
| Prompts, normalize, risk calibration | **WORKING** |
| Stored results / media linkage | **PARTIALLY_IMPLEMENTED** (media_id/project_id in body; usage and results stored via jobs) |

---

## 7. Supabase Storage

| Component | Status | Evidence |
|-----------|--------|----------|
| Server client (cookies) | **WORKING** | createClient in lib/supabase/server. |
| Admin client (service role) | **WORKING** | getAdminClient(); null when key missing. |
| Storage usage (upload path from upload-session) | **PARTIALLY_IMPLEMENTED** | Upload session returns upload_path; actual Supabase Storage upload is client-side or separate step; finalize records object_path. |

---

## 8. Database Schema

| Component | Status | Evidence |
|-----------|--------|----------|
| Migrations | **WORKING** | 35+ migrations in apps/web/supabase/migrations. |
| Core tables (tenants, projects, media, jobs, etc.) | **PARTIALLY_IMPLEMENTED** | Migrations reference tenants, projects; some core tables may be from earlier Supabase setup; worker, upload_sessions, sync, ai_usage, rate_limit, idempotency, rbac, org, audit, etc. in migrations. |
| RLS | **PARTIALLY_IMPLEMENTED** | RLS/policy references in migrations; full audit of all tables not verified in this pass. |

---

## 9. Job Pipeline

| Component | Status |
|-----------|--------|
| Job table and events | **WORKING** (migrations) |
| Queue (DB-backed) | **WORKING** (queue.db, queue.service) |
| processJobs / claim | **WORKING** |
| Handlers (ai-analyze-media, ai-analyze-report, export, retention, resolve-image-url) | **WORKING** |
| Cron trigger | **PARTIALLY_IMPLEMENTED** (HTTP /api/v1/jobs/process; no standalone cron in repo) |

---

## 10. Upload Sessions

| Component | Status |
|-----------|--------|
| Create session | **WORKING** (service + route) |
| Finalize session | **WORKING** (route) |
| Idempotency for creates | **PARTIALLY_IMPLEMENTED** (idempotency service exists; not verified on every upload-session route) |

---

## 11. Sync Endpoints

| Endpoint | Status |
|----------|--------|
| GET /api/v1/sync/bootstrap | **WORKING** (logic in route; refactor recommended) |
| GET /api/v1/sync/changes | **WORKING** |
| POST /api/v1/sync/ack | **WORKING** |
| Conflict 409 | **PARTIALLY_IMPLEMENTED** (contract doc; implementation in changes/ack to confirm) |

---

## 12. Mobile Compatibility

| Aspect | Status |
|--------|--------|
| x-client, x-device-id, x-idempotency-key | **PARTIALLY_IMPLEMENTED** (parsed; device-id required for bootstrap; idempotency not enforced on all lite writes) |
| Lite allow-list enforcement | **NOT_IMPLEMENTED** (no path-based block for admin/billing/ai/etc. for lite) |
| Worker + sync + upload-sessions + config + devices + auth | **WORKING** (routes exist and function) |

---

## 13. Web Dashboard

| Component | Status |
|-----------|--------|
| Dashboard, projects list/detail, project creation | **WORKING** (pages and client components) |
| AI insights, analysis trigger, job status | **PARTIALLY_IMPLEMENTED** (UI present; backend working) |
| Admin (governance, trust, system, ai) | **PARTIALLY_IMPLEMENTED** (pages and components; backend routes partial/stub) |
| Billing, portfolio, team | **PARTIALLY_IMPLEMENTED** (pages exist; billing depends on Stripe config) |

---

## 14. Summary Table

| System | Classification |
|--------|----------------|
| Authentication | WORKING |
| Tenant system | WORKING |
| API routes (core v1) | WORKING |
| API routes (admin/billing/SCIM) | PARTIALLY_IMPLEMENTED |
| Worker endpoints | WORKING (except 501 stubs) |
| AI endpoints | WORKING (governance path bypass) |
| Image analysis | WORKING |
| Supabase (client + admin) | WORKING |
| Database schema | PARTIALLY_IMPLEMENTED (migrations present; core tables assumed) |
| Job pipeline | WORKING |
| Upload sessions | WORKING |
| Sync endpoints | WORKING |
| Mobile (parity + lite rules) | PARTIALLY_IMPLEMENTED |
| Web dashboard | WORKING / PARTIALLY_IMPLEMENTED |
