# PHASE 0 — Platform × role matrix

**Legend:** **READY** = implemented + wired to backend in repo; **PARTIAL** = incomplete flows or heavy placeholders; **STUB** = shell only; **NOT STARTED** = no meaningful code; **R1?** = suitability for Release 1 (subjective, repo-based).

**Note:** There is no separate **“Web Client”** product binary. The column below maps to **owner / member** dashboard experiences under `(dashboard)` that are not the **Admin** route group.

---

| Surface | Scope in repo | Key paths / proof | Status | R1 notes |
|---------|----------------|-------------------|--------|--------|
| **Web Admin** | Admin dashboard, ops, billing pilot, leads, jobs, AI admin | `apps/web/app/[locale]/(dashboard)/admin/**` — e.g. `admin/page.tsx`, `admin/billing-pilot/page.tsx`, `admin/leads/page.tsx`, `admin/jobs/page.tsx`; API `app/api/v1/admin/**` | **PARTIAL** | Large surface; many routes depend on feature flags / pilot cohorts — treat as **sensitive**; narrow R1 scope. |
| **Web Manager** | Operational dashboard: tasks, reports, workers, approvals, notifications, projects | `(dashboard)/dashboard/**`, `(dashboard)/projects/**`, `team/page.tsx`, `portfolio/page.tsx`; APIs `v1/reports`, `v1/tasks`, `v1/projects`, `v1/notifications`, etc. | **READY** (core) | Core operational web path is the richest; still verify role gating per route. |
| **Web Client** (owner) | Same shell as manager; distinction is **role + API**, not app ID | `dashboard/projects`, `projects/[id]`, `billing/*`, onboarding/plan-fit components under `components/onboarding/` | **PARTIAL** | **“Client”** = non-admin tenant user; **plan-fit / billing** flows are substantial — classify billing as **PARTIAL / pilot** unless flagged for R1. |
| **iOS Worker** | Login, home, project pick, report create, photo queue, sync, submit | `ios/AiStroykaWorker/**/*.swift` — `WorkerAPI.swift`, `ReportCreateView.swift`, `OperationQueueExecutor.swift`, `BackgroundUploadService.swift` | **PARTIAL** | **No `.xcodeproj` in repo** — release engineering risk; Maestro flows exist (`maestro/flows/ios_worker_pilot.yaml`). |
| **iOS Manager** | Tabs: reports, tasks, projects, team, notifications, AI placeholders | `ios/AiStroykaManager/**/*.swift` — `ManagerAPI.swift`, `ReportsInboxView.swift`, `ManagerTabShell.swift`, placeholder views | **PARTIAL** | Several `*PlaceholderView.swift` — not full parity with web. |
| **iOS Client** | **No third app** in `ios/` — only **Worker** + **Manager** | — | **NOT STARTED** as separate app | If “client” means **homeowner**, that role is **web**-first in this repo. |
| **Android Worker** | Compose UI, `WorkerViewModel`, pilot photo bypass flag | `android/AiStroykaWorker/**`, `android/shared/WorkerApi.kt` | **PARTIAL** | **READY**-class API wiring; **debug** `PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO` — product proof must account for this; `pilotRealSubmit` property in `build.gradle.kts`. |
| **Android Manager** | Compose UI, reports, approve | `android/AiStroykaManager/**`, `ManagerApi.kt` | **PARTIAL** | Smaller surface than iOS Manager; aligned to `ManagerApi`. |
| **Android Client** | **No third app** — only **Worker** + **Manager** | — | **NOT STARTED** as separate app | Same as iOS. |

---

## Auth / session (cross-cutting)

| Platform | Mechanism (repo) |
|----------|-------------------|
| **Web** | Supabase session via `@/lib/supabase` + middleware `updateSession`; cookie-based session for browser. |
| **Mobile** | Bearer token from `AuthService` + `ApiClient`/`KeychainHelper` (iOS); `AuthService` + `SessionStore` pattern (Android shared). |
| **API** | `createClientFromRequest` + `Authorization` Bearer for mobile; `getTenantContextFromRequest` (`lib/tenant`). |

---

## Feature parity notes (abbreviated)

| Feature | Web | iOS | Android |
|---------|-----|-----|-----------|
| **Worker submit report** | N/A (worker is mobile) | Implemented path in code | Implemented |
| **Manager approve/reject** | Dashboard approvals + reports | `ManagerAPI` + views | `ManagerApi.reportReview` |
| **Notifications** | `dashboard/notifications`, API `v1/notifications` | `NotificationsView` (+ placeholder) | **Verify** — not deeply audited in Phase 0 file read |
| **Billing / plan-fit** | Many routes + UI components | Not primary in mobile trees | Not primary |
| **AI copilot / brain** | `lib/ai-brain/**`, many `/api/v1/ai/**` routes | Manager placeholders | **Minimal** in Android Manager |

---

## Evidence commands (for auditors)

```bash
# Web pages (app router)
find apps/web/app -name 'page.tsx' | wc -l

# API routes
find apps/web/app/api -name 'route.ts' | wc -l

# iOS / Android source counts
find ios -name '*.swift' | wc -l
find android -name '*.kt' | wc -l
```
