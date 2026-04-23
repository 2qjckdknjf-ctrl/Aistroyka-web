# PHASE 0 — Module status inventory

Each row: **Status** (READY / PARTIAL / STUB / NOT STARTED / EXISTS OUT OF R1), **Proof** (paths), **Risks**.

---

## Auth

| Item | Status | Proof | Risks |
|------|--------|-------|--------|
| Supabase server client | **READY** | `apps/web/lib/supabase/server.ts`, middleware `updateSession` | Session + Bearer duality must stay consistent on API routes. |
| Mobile password auth | **PARTIAL** | `ios/Shared/.../AuthService.swift`, `android/shared/.../AuthService.kt` | Custom REST auth; must match Supabase URL/key config. |
| Tenant resolution | **READY** | `apps/web/lib/tenant/tenant.context.ts`, `tenant.types.ts` | Owner vs `tenant_members` — migrations + helpers (`getActiveTenantId`). |

---

## Tenant

| Item | Status | Proof | Risks |
|------|--------|-------|--------|
| Context on requests | **READY** | `getTenantContextFromRequest`, guards | Breaking changes affect **all** `/api/v1` routes. |
| RLS (database) | **PARTIAL** (operational) | `apps/web/supabase/migrations/*.sql` (68 files) | Remote apply vs repo drift; worker/owner policies evolved in multiple migrations. |

---

## Roles & permissions

| Item | Status | Proof | Risks |
|------|--------|-------|--------|
| DB roles | **READY** | `tenant.types.ts` — `owner \| admin \| member \| viewer` | — |
| RBAC / scopes | **PARTIAL** | `tenant.context.ts` references `getUserScopes` | Full matrix not enumerated in Phase 0. |
| Lite client allow list | **READY** | `lib/api/lite-allow-list.ts`, `middleware.ts` | Changing paths breaks mobile **Worker**/**lite** clients. |

---

## Projects

| Item | Status | Proof | Risks |
|------|--------|-------|--------|
| API | **READY** | `app/api/v1/projects/**`, `lib/domain/projects/**` | Large surface (media, intelligence, milestones, costs). |
| Web UI | **READY** | `(dashboard)/dashboard/projects/**`, `(dashboard)/projects/**` | Two project UIs (dashboard vs projects) — IA complexity. |

---

## Tasks

| Item | Status | Proof | Risks |
|------|--------|-------|--------|
| API | **READY** | `app/api/v1/tasks/**` | — |
| Web | **READY** | `dashboard/tasks/**` | — |
| Mobile | **PARTIAL** | iOS `TaskDetailView.swift`, Android — task surfaces in ViewModels | Parity incomplete vs web. |

---

## Reports (worker + manager)

| Item | Status | Proof | Risks |
|------|--------|-------|--------|
| Worker API | **READY** | `v1/worker/report/create`, `add-media`, `submit`; `lib/domain` report services | Historical **createClient** vs **createClientFromRequest** issues documented in launch docs — verify route files still consistent. |
| Manager API | **READY** | `v1/reports/**`, PATCH review | — |
| Web | **READY** | `dashboard/reports/**`, `daily-reports/**` | — |

---

## Review (manager)

| Item | Status | Proof | Risks |
|------|--------|-------|--------|
| API | **READY** | `v1/reports/[id]` PATCH, approval history routes | — |
| Mobile | **PARTIAL** | `ManagerAPI.reportReview`, `ManagerApi.reportReview` | UI completeness varies (iOS placeholders). |

---

## Notifications

| Item | Status | Proof | Risks |
|------|--------|-------|--------|
| API | **READY** | `v1/notifications/**`, `read-all`, `unread-count` | — |
| Web | **READY** | `dashboard/notifications/page.tsx`, `NotificationBadge.tsx` | — |
| Mobile | **PARTIAL** | iOS `NotificationsView.swift` (+ placeholder file present) | Push: `PushRegistrationService` (iOS) — production APNS not verified in Phase 0. |

---

## Earnings / payment (light)

| Item | Status | Proof | Risks |
|------|--------|-------|--------|
| Stripe / billing | **PARTIAL** | `v1/billing/**`, `webhooks/stripe`, `lib/platform/billing-readiness/**` | Pilot cohort tables in migrations (`billing_pilot_workspaces`, etc.) — **EXISTS BUT OUT OF R1** unless product selects. |
| Plan-fit onboarding | **PARTIAL** | `v1/plan-fit/**`, `components/onboarding/plan-fit/**` | Large UX; touches tenant state. |

---

## AI assist (product + “AI brain”)

| Item | Status | Proof | Risks |
|------|--------|-------|--------|
| Dashboard AI pages | **PARTIAL** | `dashboard/ai/**`, `v1/projects/[id]/copilot/**` | — |
| AI brain library | **PARTIAL / EXISTS OUT OF R1** | `apps/web/lib/ai-brain/**` (phase-a/b/c/d/e) | Broad experimental surface — **do not assume R1**. |
| Public AI marketing | **READY** | `(public)/ai-demo`, `copilot` pages | Marketing vs product separation. |

---

## Media

| Item | Status | Proof | Risks |
|------|--------|-------|--------|
| Upload sessions | **READY** | `v1/media/upload-sessions/**`, `lib/domain/upload-session/**` | Storage RLS + path rules — mobile clients must use **server-provided** `upload_path`. |
| Project / document media | **READY** | `v1/projects/[id]/media`, documents upload routes | — |

---

## Mobile shared layers

| Item | Status | Proof | Risks |
|------|--------|-------|--------|
| iOS Shared | **READY** | `ios/Shared/Sources/Shared/` — `APIClient`, `AuthService`, `Endpoints.swift` | Decoding + base URL assumptions (see launch audits). |
| Android shared | **READY** | `android/shared/...` — `ApiClient.kt`, `WorkerApi.kt`, `ManagerApi.kt` | `x-client` profile must match allow list. |

---

## Contracts

| Item | Status | Proof | Risks |
|------|--------|-------|--------|
| Zod contracts package | **READY** | `packages/contracts/` | Prebuild step `build:contracts` in web `prebuild`. |
| OpenAPI package | **PARTIAL** | `packages/contracts-openapi/` | Consumption path not audited in Phase 0. |

---

## Build systems

| Item | Status | Proof | Risks |
|------|--------|-------|--------|
| Web | **READY** | `next build`, `cf:build` OpenNext + Wrangler | Cloudflare bundle size limits (noted in AGENTS / launch docs). |
| Android | **PARTIAL** | Gradle Kotlin DSL `*.gradle.kts` | No test tasks evidenced. |
| iOS | **PARTIAL** | SwiftPM `Shared` only in repo | **Missing Xcode project in repo** — highest release risk. |

---

## Sync engine (mobile offline)

| Item | Status | Proof | Risks |
|------|--------|-------|--------|
| API | **READY** | `v1/sync/bootstrap`, `changes`, `ack` | — |
| iOS client | **PARTIAL** | `SyncService.swift`, `WorkerAPI.sync*` | Complexity + conflict handling. |
| ADR | **EXISTS** | `docs/ADR/020-offline-first-sync-engine.md` | Long-term architecture — not all code paths verified. |

---

## Jobs / cron

| Item | Status | Proof | Risks |
|------|--------|-------|--------|
| Admin jobs | **PARTIAL** | `v1/admin/jobs/**`, `cron-tick` | Production scheduling depends on Cloudflare cron secrets (`workflows` docs). |
