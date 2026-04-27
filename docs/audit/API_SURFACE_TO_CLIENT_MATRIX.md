# API SURFACE → CLIENT MATRIX

**Audit date:** 2026-04-02  
**Method:** Map primary UI entry points to `app/api` routes and mobile clients. Not every dashboard sub-page is listed row-by-row; groupings reference representative file paths. **196** API route files exist under `apps/web/app/api/`.

**Auth modes**

- **Web:** Supabase cookie/session via `@supabase/ssr` (`createClientFromRequest` / middleware `updateSession`).
- **Mobile / API tooling:** `Authorization: Bearer <JWT>` plus `x-device-id`, `x-client` (`ios_lite` | `android_lite` | `ios_manager` | `web` variants per client).
- **Lite enforcement:** `apps/web/middleware.ts` calls `checkLiteAllowList` for `/api/v1/*`; disallowed paths → **403** `lite_client_path_forbidden` (`apps/web/lib/api/lite-allow-list.ts`).

---

## Public website (unauthenticated HTML)

| Page / area | File path | Endpoint(s) | Auth | Role | x-client | Parity | Notes |
|-------------|-----------|-------------|------|------|----------|--------|-------|
| Landing | `app/[locale]/(public)/page.tsx` | Mostly static; may hit marketing APIs indirectly | None | Public | n/a | N/A | Localized SSG |
| Contact | `(public)/contact/page.tsx` | `POST /api/contact` (if form wired) | None | Public | n/a | N/A | Verify form → route in code path |
| Pricing / About / Workflows / Enterprise / AI pages | `(public)/*/page.tsx` | Varies | None | Public | n/a | N/A | Claims vs backend features: **not** fully verified per page in this audit |

---

## Auth entry

| Screen | File path | Endpoint(s) | Auth | Role | x-client | Parity | Notes |
|--------|-----------|-------------|------|------|----------|--------|-------|
| Login | `(auth)/login/page.tsx` | Supabase client auth (not necessarily REST v1) | Session | Pre-tenant | n/a | ACTIVE | `next` query preserved |
| Register | `(auth)/register/page.tsx` | Supabase sign-up | Session | Pre-tenant | n/a | ACTIVE | |
| Invite accept | `[locale]/invite/accept/page.tsx` | `POST /api/tenant/accept-invite`, related | Session/Bearer | Invitee | n/a | PARTIAL | Tenant invite flow |

---

## Web dashboard (manager / internal)

| Screen | File path | Endpoint(s) (representative) | Auth | Role | x-client | Parity | Notes |
|--------|-----------|------------------------------|------|------|----------|--------|-------|
| Dashboard home | `(dashboard)/dashboard/page.tsx` | Multiple data hooks → `/api/v1/*` | Cookie | Tenant member | web | ACTIVE | Large composite |
| Projects list/detail | `.../dashboard/projects/*`, `DashboardProjectDetailClient.tsx` | `/api/v1/projects`, `/api/v1/projects/[id]/*` | Cookie | Manager roles | web | ACTIVE | Includes costs, docs, milestones |
| Tasks | `dashboard/tasks/*` | `/api/v1/tasks`, `/api/v1/tasks/[id]` | Cookie | Manager | web | ACTIVE | |
| Reports | `dashboard/reports/*`, `daily-reports/*` | `/api/v1/reports`, `/api/v1/reports/[id]` | Cookie | Manager | web | ACTIVE | Review UI |
| Approvals | `dashboard/approvals/page.tsx` | Documents/reports approval APIs | Cookie | Manager | web | ACTIVE | |
| Notifications | `dashboard/notifications/page.tsx` | `GET /api/v1/notifications`, `PATCH .../read` | Cookie | Tenant user | web | ACTIVE | |
| Team / workers | `team/page.tsx`, `dashboard/workers/*` | `/api/v1/workers`, `/api/v1/workers/[userId]/*` | Cookie | Manager | web | ACTIVE | |
| AI / Copilot (dashboard) | `dashboard/ai/*`, project AI panels | `/api/v1/projects/[id]/copilot`, `.../ai`, stream route | Cookie | Manager | web | PARTIAL | Depends on provider env |
| Admin | `admin/*` | `/api/v1/admin/*`, ops, jobs, leads | Cookie | Admin-gated | web | PARTIAL | `requireAdmin` patterns |

---

## Web owner / client / stakeholder

| Screen | File path | Endpoint(s) | Auth | Role | x-client | Parity | Notes |
|--------|-----------|-------------|------|------|----------|--------|-------|
| Client home | `dashboard/projects/[id]/client/page.tsx` | `/api/v1/projects/[id]/client-view`, portal, stakeholder | Cookie | Stakeholder / client | web | PARTIAL | **No native client app** |
| Service requests / defects / discussions (client) | `.../client/*` | Project-scoped v1 routes | Cookie | Stakeholder | web | PARTIAL | |

---

## iOS Worker (`ios_lite`)

| Flow | File path | Endpoint(s) | Auth | Role | x-client | Parity | Notes |
|------|-----------|-------------|------|------|----------|--------|-------|
| API client | `ios/Shared/Sources/Shared/APIClient.swift` | All under `/api/v1/` root | Bearer | Worker | `ios_lite` | ACTIVE | Sets `x-client` |
| Config / projects | `WorkerAPI.swift` | `GET config`, `GET projects` | Bearer | Worker | ios_lite | ACTIVE | Lite allow list |
| Tasks / day / report | `WorkerAPI.swift` | `worker/tasks/today`, `worker/day/*`, `worker/report/*` | Bearer | Worker | ios_lite | ACTIVE | Idempotency headers |
| Media | `WorkerAPI.swift` | `POST media/upload-sessions`, `.../finalize` | Bearer | Worker | ios_lite | PARTIAL | STAGE4: E2E proof **open** |
| Sync | `WorkerAPI.swift` | `sync/bootstrap`, `sync/changes`, `sync/ack` | Bearer | Worker | ios_lite | ACTIVE | 409 conflict path |
| Push registration | `WorkerAPI.swift` | `POST devices/register` | Bearer | Worker | ios_lite | PARTIAL | Token handling |

---

## iOS Manager (`ios_manager`)

| Flow | File path | Endpoint(s) | Auth | Role | x-client | Parity | Notes |
|------|-----------|-------------|------|------|----------|--------|-------|
| Me / projects / tasks / reports | `ManagerAPI.swift` | `me`, `projects`, `tasks`, `reports` | Bearer | Manager | `ios_manager` | ACTIVE | **Not** lite — full v1 surface per middleware |
| Review | `ManagerAPI.swift` | `PATCH /api/v1/reports/[id]` | Bearer | Manager | ios_manager | ACTIVE | |
| Ops / AI / notifications | `ManagerAPI.swift` | `ops/overview`, `ai/requests`, `notifications` | Bearer | Manager | ios_manager | PARTIAL | Web still broader |

---

## Android Worker (`android_lite`)

| Flow | File path | Endpoint(s) | Auth | Role | x-client | Parity | Notes |
|------|-----------|-------------|------|------|----------|--------|-------|
| HTTP | `android/shared/.../ApiClient.kt` | Mirrors iOS v1 paths | Bearer | Worker | `android_lite` | ACTIVE | `CLIENT_PROFILE = android_lite` |
| Worker flows | `WorkerApp.kt`, view models | Same as iOS Worker list | Bearer | Worker | android_lite | PARTIAL | STAGE4 Maestro evidence |

---

## Android Manager

| Flow | File path | Endpoint(s) | Auth | Role | x-client | Parity | Notes |
|------|-----------|-------------|------|------|----------|--------|-------|
| Manager UI | `android/AiStroykaManager/.../ManagerApp.kt` | Manager v1 endpoints | Bearer | Manager | typically full profile (verify `AppRuntime`) | PARTIAL | Parity vs iOS Manager |

---

## Cross-cutting API families (no single page)

| Family | Routes | Consumers | Notes |
|--------|--------|-----------|-------|
| Health | `/api/health`, `/api/v1/health` | Ops, smoke scripts | Public / low-auth |
| Ops metrics | `/api/v1/ops/metrics` | `scripts/smoke/pilot_launch.sh` | **Tenant JWT required** |
| Cron | `POST /api/v1/admin/jobs/cron-tick` | Vercel/CF cron | Secret/header gated |
| Billing | `/api/v1/billing/*`, webhooks | Dashboard billing | Stripe |
| Plan-fit | `/api/v1/plan-fit/*` | Onboarding | Large surface |

---

## Contracts package

| Artifact | Path | Role |
|----------|------|------|
| DTOs / Zod | `packages/contracts/src` | Shared types for worker/sync/upload — **web + mobile implied**; mobile uses hand-written DTOs in Swift/Kotlin |

**Parity status summary:** Web and API are **broad and tested**. Mobile maps to **subset** of v1 (lite) or **full** (manager). **End-to-end cross-platform proof** is **PARTIAL** (Android Maestro evidence in STAGE4; iOS not closed).
