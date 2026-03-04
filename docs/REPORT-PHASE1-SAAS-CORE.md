# Phase 1 — SaaS Core: Domain + Governance + Mobile-Ready APIs

**Project:** AISTROYKA.AI  
**Stack:** Next.js 14 + OpenNext + Cloudflare Workers + Supabase + OpenAI  
**Completed:** Phase 1.1–1.8

---

## 1. Domain layer overview

Domain modules live under `apps/web/lib/domain/` with clear boundaries:

| Domain    | Service / Repository / Policy | Purpose |
|----------|-------------------------------|--------|
| **tenants** | getOrCreateTenantForUser, getTenant; getTenantById, getMemberRole, listMembers | Tenant resolution and membership |
| **projects** | listProjects, getProject, createProject; listByTenant, getById, create | Project CRUD, tenant-scoped |
| **tasks** | listTasksForToday; listTasksForUser (worker_tasks) | Worker Lite tasks for today |
| **reports** | createReport, addMediaToReport, submitReport; create, getById, addMedia, submit | Worker reports (draft → submit) |
| **media** | listMediaForProject, getMedia; listByProject, getById | Project media listing |
| **worker-day** | startDay, endDay; getOrCreateForDate, setStarted, setEnded | Worker day start/end |
| **upload-session** | createUploadSession, finalizeUploadSession; create, getById, finalize | Mobile upload session (create → client upload → finalize) |

- **Service:** orchestration, policy checks, validation.  
- **Repository:** Supabase queries only (no business logic).  
- **Policy:** role-based (viewer/member/admin/owner); Worker Lite requires at least member for write.

All v1 routes use `getTenantContextFromRequest` → `requireTenant` and then call domain services. Legacy `/api/projects` uses the same `listProjects` / `createProject` services.

---

## 2. Rate-limit design choice + rationale

**Chosen approach:** Supabase table-based rate limiting (`rate_limit_slots`: key, window_start, count).

- **Rationale:** No Redis in Workers; Cloudflare KV/DO not assumed. Supabase is already in use and supports server-side writes with service_role. 1-minute rolling window; key = `tenant:{id}:{endpoint}` or `ip:{addr}:{endpoint}`.
- **Trade-off:** Read-then-increment is slightly racy under concurrency; acceptable for Phase 1. Future: atomic RPC or advisory locks if needed.
- **Applied to:** `/api/v1/ai/analyze-image`, `/api/auth/login` (and `/api/v1/worker/report/submit` in HIGH_RISK list). Returns **429** when exceeded.

See **ADR-001-rate-limiting.md**.

---

## 3. Quota / budget enforcement design

- **Subscription tiers:** FREE, PRO, ENTERPRISE (limits in `lib/platform/subscription/limits.ts`; tier from `tenants.plan`).
- **Before AI call:** `checkQuota(tenantId, estimatedCostUsd)` compares `spent_usd + estimated` vs `monthly_ai_budget_usd`. If over → **402 Payment Required** with `code: "quota_exceeded"`.
- **After AI call:** `recordUsage(admin, record)` inserts into `ai_usage` and increments `tenant_billing_state.spent_usd`.
- **Semantics:** 402 = quota/budget exceeded; 429 = rate limit exceeded. See **ADR-002-quota-402-vs-429.md**.

---

## 4. DB migrations added

| Migration | Tables / changes |
|-----------|-------------------|
| `20260304000000_rate_limit_slots.sql` | rate_limit_slots (key, window_start, count) |
| `20260304000100_ai_usage_and_billing.sql` | ai_usage, tenant_billing_state |
| `20260304000200_tenants_plan.sql` | tenants.plan (text, default 'FREE') |
| `20260304000300_worker_lite.sql` | worker_day, worker_reports, worker_report_media, worker_tasks + RLS |
| `20260304000400_upload_sessions.sql` | upload_sessions (purpose, status, object_path, expires_at) + RLS |

---

## 5. Worker Lite API design + endpoints

All require auth + TenantContext; policy enforces at least **member** for write, **viewer** for read (tasks).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/worker/tasks/today` | List tasks assigned to current user for today |
| POST | `/api/v1/worker/day/start` | Start today’s worker day |
| POST | `/api/v1/worker/day/end` | End today’s worker day |
| POST | `/api/v1/worker/report/create` | Create draft report (body: optional `day_id`) |
| POST | `/api/v1/worker/report/add-media` | Add media to report (body: `report_id`, `media_id` or `upload_session_id`) |
| POST | `/api/v1/worker/report/submit` | Submit report (body: `report_id`) |

Payloads are small and mobile-friendly. See **docs/API-v1-ENDPOINTS.md** and **ADR-005-worker-lite-scope.md**.

---

## 6. Upload sessions design

- **Create:** POST `/api/v1/media/upload-sessions` with body `{ "purpose": "report_before" | "report_after" | "project_media" }` → returns `{ data: { id, upload_path, expires_at, ... } }`.
- **Client:** Uploads file to Supabase Storage at `upload_path` (bucket `media`, path `{tenant_id}/{session_id}` or similar) using client Supabase with user JWT.
- **Finalize:** POST `/api/v1/media/upload-sessions/:id/finalize` with body `{ "object_path", "mime_type?", "size_bytes?" }`. Policy: only the session owner can finalize. Session must be in `created`/`uploaded` and not expired.

See **ADR-004-upload-session-model.md**.

---

## 7. Backward compatibility strategy for legacy routes

- **Legacy `/api/*`** remain; no breaking changes.
- **Projects:** `/api/projects` and `/api/v1/projects` both use `listProjects` / `createProject` from domain (thin route → service).
- **AI analyze:** `/api/ai/analyze-image` and `/api/v1/ai/analyze-image` share the same handler; quota and rate limit apply when tenant is present.
- **Worker and media:** New capabilities live under `/api/v1/` only. Legacy upload remains `/api/projects/[id]/upload` (direct upload) until clients migrate to upload-session flow.

See **ADR-006-legacy-adapter-strategy.md**.

---

## 8. Risks remaining + Phase 2 roadmap

**Risks:**

- Rate-limit read-then-increment race under high concurrency.
- `tenant_billing_state.spent_usd` update is non-atomic (two concurrent AI calls can double-count).
- Migrations in `apps/web/supabase/migrations/` may need to be applied to the same DB as engine (script currently points at `engine/Aistroyk/supabase/migrations` in some setups).

**Phase 2 suggestions:**

- Atomic rate-limit (RPC or lock) and atomic billing increment (RPC or row lock).
- Worker Lite E2E: full flow (create report → add media via upload session → submit).
- Contracts: formal Zod validation on v1 request/response where missing.
- Optional: Cloudflare KV/DO for rate limits if Supabase latency becomes an issue.

---

## 9. Verification (Phase 1.8)

- **next build:** OK.
- **Unit tests:** rate-limit (rateLimitKey, HIGH_RISK_ENDPOINTS), ai-usage (checkQuota, estimateCostUsd), report.policy (canCreateReport), worker-day.policy (canManageWorkerDay) — all pass. Vitest may pick up Playwright specs in `audit_*` folders; exclude via config if needed.
- **E2E worker happy path:** Not automated in this phase; manual or follow-up.

## 10. Deliverables checklist

- [x] Domain modules (1.1)
- [x] Subscription + limits (1.2)
- [x] Rate limiting (1.3)
- [x] AI usage tracking + cost governance (1.4)
- [x] Worker Lite MVP endpoints (1.5)
- [x] Media upload session (1.6)
- [x] Legacy routes as adapters (1.7)
- [x] Unit tests (rate-limit, quota, worker policies); REPORT; API-v1-ENDPOINTS; ADRs (1.8)
