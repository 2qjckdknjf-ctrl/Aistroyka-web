# Architecture State Analysis

**Purpose:** Evaluate layered architecture and identify violations.  
**Reference:** Clients → API → Tenant/Auth → Domain Services → Repositories → Platform → Providers.

---

## 1. Target Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CLIENTS (web, ios_full, ios_lite, android_full, android_lite)             │
│ x-client, x-device-id, x-idempotency-key                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ API ROUTES (Next.js Route Handlers)                                      │
│ Validate input → Create context → Call services → Return response        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ TENANT / AUTH LAYER                                                      │
│ getTenantContextFromRequest, requireTenant, authorize(scopes)            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ DOMAIN SERVICES                                                          │
│ Business rules, authorization checks, orchestration                     │
│ (project, media, report, upload-session, worker-day, task, tenant, org) │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ REPOSITORIES                                                             │
│ Data access only (Supabase client)                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PLATFORM MODULES (jobs, ai-usage, rate-limit, idempotency, billing, …)  │
│ AI: Policy Engine → Provider Router → Providers                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layer Compliance Summary

| Layer | Status | Notes |
|-------|--------|--------|
| Clients | Partial | x-client parsed; no enforced Lite allow-list by path. |
| API routes | Mixed | Many routes validate → context → service → response; some contain direct DB or logic. |
| Tenant/Auth | Good | Tenant context + requireTenant + authorize(scope) used widely. |
| Domain services | Good | Present for projects, media, reports, tasks, upload-session, worker-day, org, tenants. |
| Repositories | Good | Repositories used; some routes still query Supabase directly. |
| Platform | Present | Jobs, AI usage, rate-limit, idempotency, billing, flags. |
| AI governance | Violation | analyze-image route calls OpenAI directly; Provider Router exists but not used by route. |

---

## 3. Architecture Violations

### 3.1 Business logic in routes

- **sync/bootstrap (GET):** Builds response by calling `listTasksForToday` (service) then querying `worker_reports`, `upload_sessions`, and `getMaxCursor` directly in the route. **Recommendation:** Move to a single SyncService.bootstrap(ctx) that returns tasks, reports, sessions, cursor.
- **ai/analyze-image:** Contains validation, URL check, OpenAI fetch, retry loop, JSON parse, normalize, calibrate, usage recording, and logging in one large handler. **Recommendation:** Move to an AIService (or VisionService) that uses Policy Engine + Provider Router; route only validates input, gets context, calls service, returns response.

### 3.2 Direct database access from routes

- **sync/bootstrap:** Direct `supabase.from("worker_reports")`, `supabase.from("upload_sessions")` in route. Breaks “repositories only” boundary.
- Other v1 routes generally use domain services or platform services; bootstrap is the main offender.

### 3.3 AI calls bypassing governance

- **POST /api/ai/analyze-image (and /api/v1/ai/analyze-image):** Calls `fetch("https://api.openai.com/v1/chat/completions", ...)` directly with `OPENAI_API_KEY`. Does not go through:
  - `lib/platform/ai/providers/provider.router.ts` (invokeVisionWithRouter)
  - `lib/platform/ai-governance/policy.service`
  - Circuit breaker in `lib/platform/ai/providers/circuit-breaker.ts`  
- Job handlers (e.g. ai-analyze-media) use `runVisionAnalysis` in lib/ai, which also calls OpenAI directly (not the Provider Router). So both sync AI and async job AI bypass the router and policy engine.
- **Recommendation:** Introduce a single AIService (or VisionService) that: (1) checks policy, (2) calls provider.router (which uses circuit breaker and multi-provider fallback), (3) records usage. Routes and job handlers call this service only.

### 3.4 Missing tenant context

- **Health routes:** Intentionally no tenant (public readiness).
- **analyze-image:** Optional auth; tenant used for rate-limit and quota when present. No missing-tenant violation.
- Most v1 routes call `getTenantContextFromRequest` and `requireTenant`; tenant isolation at route level is in place except where routes bypass services and query by tenant_id themselves (bootstrap).

### 3.5 Lite API isolation not enforced in code

- Architecture guardrails require Lite clients to access only worker/*, sync/*, media/upload-sessions*, reports/*/analysis-status, config, devices/*, auth/*. There is no central middleware or route guard that rejects Lite (x-client = ios_lite | android_lite) requests to admin, billing, org, analytics, projects, export, security, jobs/process, ai/*. **Recommendation:** Add middleware or a small wrapper that checks x-client and path and returns 403 for disallowed combinations.

---

## 4. Diagram: Current vs Target (AI Flow)

**Current:**

```
Route /api/ai/analyze-image
  → getTenantContextFromRequest, rate-limit, quota
  → fetch(openai.com) directly
  → normalize, calibrate, recordUsage
  → response
```

**Target:**

```
Route /api/v1/ai/analyze-image
  → validate input, getTenantContextFromRequest
  → AIService.analyzeImage(ctx, imageUrl)
      → Policy Engine (allow/deny, PII)
      → Provider Router (circuit breaker, fallback)
      → Provider (OpenAI / Anthropic / Gemini)
      → recordUsage, audit
  → return response
```

---

## 5. Recommended Refactors (Priority)

1. **High:** Introduce AIService (or VisionService) used by both the analyze-image route and job handlers; route and handlers call only this service. Service uses policy engine + provider.router + usage recording.
2. **High:** Refactor sync/bootstrap to use a SyncService.bootstrap(ctx) that encapsulates tasks, reports, upload sessions, and cursor; route becomes thin.
3. **Medium:** Add Lite client allow-list enforcement (middleware or route guard) so ios_lite/android_lite cannot call admin, billing, ai, jobs/process, etc.
4. **Medium:** Remove duplicate root `app/` or document its purpose and ensure only one app (apps/web) is deployed.
5. **Low:** Align naming with guardrails: e.g. consolidate “construction brain” under one module if desired; current lib/ai + lib/intelligence is acceptable if documented.

---

## 6. What Is Already Aligned

- Tenant context and authorization (requireTenant, authorize) are used consistently across v1.
- Domain services and repositories exist and are used by most routes.
- Platform modules (jobs, queue, ai-usage, rate-limit, idempotency, billing, flags) are in place.
- Provider Router and circuit breaker exist; they are just not used by the main AI entry points (route + runVisionAnalysis).
