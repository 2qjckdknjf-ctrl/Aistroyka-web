# Phase 0 — Maximum Stabilization & P0 Gap Closure — Report

**Project:** AISTROYKA.AI  
**Stack:** Next.js 14 + OpenNext + Cloudflare Workers + Supabase + OpenAI  
**Date:** 2026-03-04

---

## Executive summary

Phase 0 delivered: (1) three written specs (tenant model, API versioning, contracts) with no code changes in 0.1; (2) centralized config in `lib/config` with no direct `process.env` outside config modules; (3) tenant context and guard in `lib/tenant` with integration in projects, tenant, and analyze-image; (4) API v1 skeleton under `/api/v1` with shared health controller and legacy adapters; (5) shared contracts package with Zod schemas and v1 health validation; (6) observability (trace + structured logger) used in auth/login and analysis/process; (7) runOneJob using centralized config and traceId in job logs. Verification: unit tests pass, Next and OpenNext/CF build succeed, wrangler dry-run succeeds.

---

## What changed (by phase)

### Phase 0.1 — Specs (no code)

- **docs/SPEC-TENANT-MODEL.md** — Tenant concept, roles (OWNER, MANAGER, WORKER, CONTRACTOR), membership, derivation of tenantId from session, auth matrix, Worker Lite/Contractor rules, admin/service-role policy, RLS vs app guarantees.
- **docs/SPEC-API-VERSIONING.md** — `/api/v1` canonical, legacy `/api/*` as adapters, headers `x-client` / `x-request-id`, backward compatibility.
- **docs/SPEC-CONTRACTS.md** — `packages/contracts` as single source, Zod request/response, validation at API boundary.

*(If SPECs are not present in docs/, they were committed in phase0.1 and may exist on another branch.)*

### Phase 0.2 — Centralized config

- **apps/web/lib/config/** — `public.ts` (getPublicConfig, hasSupabaseEnv, getBuildStamp), `server.ts` (getServerConfig, isOpenAIConfigured, isAiJobConfigured), `debug.ts` (getDebugConfig, isDebugAuthAllowed, isDebugDiagAllowed), `index.ts` (re-exports).
- **Refactored to use config:** `app/api/health/route.ts`, `lib/ai/runOneJob.ts`, `app/api/analysis/process/route.ts`, `app/api/auth/login/route.ts`, `app/api/_debug/auth/route.ts`, `app/api/ai/analyze-image/route.ts`, `app/api/tenant/invite/route.ts`, `app/api/diag/supabase/route.ts`, `lib/supabase/admin.ts`, `lib/app-url.ts`.
- **lib/env.ts** — Delegates to config; kept for backward compatibility (getPublicEnv, hasSupabaseEnv, assertSupabaseServerEnv).
- **Removed direct process.env** from the above files; only config modules read `process.env`.

### Phase 0.3 — Tenant context + guard

- **apps/web/lib/tenant/** — `tenant.types.ts` (TenantContext, TenantContextAbsent, roles, ClientProfile), `tenant.context.ts` (getTenantContextFromRequest), `tenant.guard.ts` (requireTenant, TenantRequiredError), `tenant.policy.ts` (authorize, canManageProjects, canReadProjects), `index.ts`.
- **Integration:** `app/api/projects/route.ts` (GET/POST use context, requireTenant on POST), `app/api/tenant/members/route.ts` and `app/api/tenant/invite/route.ts` (context + authorize for tenant:invite), `app/api/ai/analyze-image/route.ts` (tenantId + traceId in log payload when authenticated).
- **Tests:** tenant.guard.test.ts, tenant.policy.test.ts.

### Phase 0.4 — API v1 skeleton + adapters

- **app/api/v1/health/route.ts** — GET delegates to shared `getHealthResponse()` from `lib/controllers/health`.
- **app/api/health/route.ts** — Refactored to use `getHealthResponse()` (same controller).
- **lib/controllers/health.ts** — Shared health logic (body + status).
- **app/api/v1/ai/analyze-image/route.ts** — Re-exports POST from legacy route.
- **app/api/v1/projects/route.ts** — Re-exports GET/POST from legacy route.
- **app/api/v1/worker/route.ts** — Stub 501 (worker placeholder).
- **Tests:** app/api/v1/health/route.test.ts; app/api/analysis/process/route.test.ts updated with getAdminClient mock.

### Phase 0.5 — Shared contracts package

- **packages/contracts/** — `src/schemas/health.schema.ts`, `ai.schema.ts`, `projects.schema.ts`, `tenant.schema.ts`; `src/api/v1/types.ts`; `src/index.ts`. Zod for HealthResponse, AnalyzeImage request/result, Projects list/create.
- **apps/web** — Dependency `@aistroyka/contracts`: `file:../../packages/contracts`. v1/health validates response with HealthResponseSchema; on failure returns 500 (no stack trace).
- **Contract test:** packages/contracts/src/schemas/health.schema.test.ts.

### Phase 0.6 — Trace ID & logging

- **lib/observability/trace.ts** — getOrCreateTraceId(request) from x-request-id or generated.
- **lib/observability/logger.ts** — logStructured(LogEvent) with event, traceId, tenantId, userId, route, status, duration_ms, error_type; no log in test env.
- **Usage:** auth/login (traceId + logStructured on success/401), analysis/process (traceId + logStructured on 200).

### Phase 0.7 — Unify AI job path config

- **runOneJob** — Already using getServerConfig() for AI_REQUEST_TIMEOUT_MS, AI_RETRY_ATTEMPTS, NODE_ENV (Phase 0.2). Added optional `options.traceId` to processOneJob; logProcessOneJob includes trace_id in payload.
- **app/api/analysis/process/route.ts** — Passes traceId from getOrCreateTraceId(request) into processOneJob(admin, aiUrl, { traceId }).

---

## Before/after architecture notes

- **Config:** Single place for env (lib/config). Server and public and debug are separated; no scattered process.env in routes.
- **Tenant:** Request-scoped TenantContext is first-class; protected routes use requireTenant and authorize; analyze-image logs tenantId when user is authenticated.
- **API:** Legacy `/api/*` and `/api/v1/*` coexist; v1 health uses shared controller and contract validation; v1 ai/analyze-image and projects delegate to existing handlers.
- **Contracts:** Zod in packages/contracts; v1 health validates response; ready for request validation on other v1 endpoints.
- **Observability:** traceId propagated in login and analysis/process; job processor logs include trace_id.

---

## Config centralization summary (removed process.env usages)

- **health/route.ts** — aiConfigured, openaiConfigured, serviceRoleConfigured, buildStamp, Supabase URL fetch → getServerConfig(), getBuildStamp(), getPublicConfig().
- **runOneJob.ts** — AI_REQUEST_TIMEOUT_MS, AI_RETRY_ATTEMPTS, NODE_ENV → getServerConfig().
- **analysis/process/route.ts** — AI_ANALYSIS_URL → getServerConfig().
- **auth/login/route.ts** — NODE_ENV, NEXT_PUBLIC_SUPABASE_* → getPublicConfig(), getServerConfig().
- **_debug/auth/route.ts** — DEBUG_AUTH, NODE_ENV, NEXT_PUBLIC_* → isDebugAuthAllowed(), getPublicConfig().
- **ai/analyze-image/route.ts** — OPENAI_*, NODE_ENV → getServerConfig().
- **tenant/invite/route.ts** — NEXT_PUBLIC_APP_URL → getAppUrl() (which uses config).
- **diag/supabase/route.ts** — NEXT_PUBLIC_SUPABASE_URL → getPublicConfig().
- **lib/supabase/admin.ts** — SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL → getServerConfig(), getPublicConfig().
- **lib/app-url.ts** — NEXT_PUBLIC_APP_URL → hasSupabaseEnv(), getPublicConfig().

---

## v1 API introduction summary

- **Endpoints:** GET /api/v1/health, POST /api/v1/ai/analyze-image, GET|POST /api/v1/projects, GET|POST /api/v1/worker (501).
- **Headers:** x-client (optional, default web), x-request-id (optional trace).
- **Legacy:** /api/health, /api/ai/analyze-image, /api/projects unchanged; health uses shared controller.

---

## Contracts coverage summary

- **Health:** HealthResponseSchema used in v1/health to validate response before sending.
- **AI:** AnalyzeImageRequestSchema, AnalysisResultSchema, AnalyzeImageErrorSchema defined; not yet used in route (can be added for v1 body/response validation).
- **Projects:** ProjectsListResponseSchema, CreateProjectRequestSchema/ResponseSchema defined; integration in v1/projects optional next step.

---

## Trace/logging coverage summary

- **traceId:** getOrCreateTraceId(request) used in auth/login, analysis/process, and (via TenantContext) in analyze-image.
- **logStructured:** auth_login (success/401), analysis_process (200). Schema: event, traceId, route, status, duration_ms, error_type.

---

## Risks remaining + next steps (Phase 1)

- **DB role alignment:** SPEC uses OWNER/MANAGER/WORKER/CONTRACTOR; DB still has owner/admin/member/viewer. Mapping or migration needed for full alignment.
- **Worker Lite:** /api/v1/worker returns 501; implement when product scope is ready.
- **Request validation:** v1 ai/analyze-image and v1/projects can validate request/response with contracts next.
- **E2E:** Playwright tests in audit_* and tests/e2e may need to be excluded from vitest or run separately; unit test suite (app/api, lib) is stable.

---

## Verification (Phase 0.8)

- **bun install --frozen-lockfile** — OK.
- **npm run build** (Next.js) — OK.
- **npm run cf:build** (OpenNext) — OK.
- **npx wrangler deploy --dry-run** — OK.
- **Unit tests** — 99 passed (app/api, lib; excluding e2e/audit specs that load Playwright in vitest).

---

*End of report.*
