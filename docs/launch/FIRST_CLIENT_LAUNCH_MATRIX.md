# First-client launch matrix (STAGE 0)

**Date:** 2026-03-24  
**Method:** Repo-first inventory (source + `docs/final/PHASE6_MOBILE_INVENTORY.md`). Production E2E sessions are **not** re-proven here.

Legend: **Done** = implemented in code paths reviewed | **Partial** = some flows or gaps | **Missing** = not present or stub only | **Unknown** = needs device/runtime proof

---

## Android Worker (`android/AiStroykaWorker/`)

| Capability | Status | Notes |
|------------|--------|--------|
| Login / auth | **Missing** | UI is placeholder only (`WorkerApp.kt`: centered label). No `AuthService`, no Supabase, no token. |
| Config / bootstrap | **Missing** | `android/shared/Config.kt` has default API URL string; **not wired** to UI or HTTP. |
| Project / task / report context | **Missing** | No networking layer (no OkHttp/Retrofit/Ktor in tree). |
| Create report | **Missing** | — |
| Add photo / video / comment | **Missing** | — |
| Upload session / finalize / submit | **Missing** | — |
| Submission / result visibility | **Missing** | — |
| Sync bootstrap / changes / ack | **Missing** | iOS implements; Android does not. |

**Overall:** **Missing** — single-screen stub; weakest surface for launch.

---

## Android Manager (`android/AiStroykaManager/`)

| Capability | Status | Notes |
|------------|--------|--------|
| Login / role routing | **Missing** | Stub UI only (`ManagerApp.kt`). |
| Project / report / task visibility | **Missing** | — |
| Report detail / media / AI | **Missing** | — |
| Review: approve / reject / request changes | **Missing** | — |
| Pending attention | **Missing** | — |

**Overall:** **Missing** — same stub class of problem as Worker.

---

## iOS Worker (`ios/AiStroykaWorker/` + `ios/Shared/`)

| Capability | Status | Notes |
|------------|--------|--------|
| Login | **Done** | `LoginView` + `AuthService` (Supabase password grant); `RootView` → `HomeContainerView` when logged in. |
| Role / routing | **Partial** | Worker-oriented; `APIClient` uses `x-client: ios_lite` (legacy header value; still “worker” profile). |
| Project / task visibility | **Done** | `WorkerAPI.projects`, `worker/tasks/today`, task detail navigation. |
| Create report | **Done** | `WorkerAPI.createReport`; `ReportCreateView` + operation queue. |
| Add photo | **Done** | Before/after photos; camera + library; JPEG upload via `UploadManager` / queue. |
| Add video | **Missing** in UI | No video capture or file upload path in Worker Swift (grep: no video pipeline). |
| Add text comment | **Missing** | No worker comment field in report UI; domain model inspected has no worker text body on report. |
| Upload / finalize / submit | **Done** | `createUploadSession`, `finalizeUploadSession`, `addMedia`, `submitReport`. |
| Visible submission state | **Partial** | Local queue states + “Submitted” in `ReportCreateView`; depends on backend for server truth. |
| Sync / bootstrap / changes / ack | **Done** (API) | `WorkerAPI.syncBootstrap`, `syncChanges`, `syncAck` implemented. |

**Overall:** **Partial** — strongest mobile Worker implementation in repo; **gaps vs stated must-have: video + worker text comment.**

---

## iOS Manager (`ios/AiStroykaManager/` + Shared)

| Capability | Status | Notes |
|------------|--------|--------|
| Login | **Done** | `ManagerLoginView` + shared `AuthService`. |
| Role-aware access | **Done** | `ManagerSessionState` + `ManagerAPI.me()` — allows owner/admin/member; blocks viewer with message. |
| Project / task / report lists | **Done** | Tab shell: Home, Projects, Tasks, Reports, Team, AI, More. |
| Report detail | **Done** | `ReportDetailReviewView` loads `GET /api/v1/reports/:id`. |
| Media preview | **Partial** | Depends on report DTO / URLs from API (verify with runtime). |
| AI summary / evidence / risk | **Partial** | `projectAi`, `aiRequests`, report `analysis_status` in list — depth varies by backend enrichment. |
| Review: approve / reviewed / changes_requested | **Done** | `ManagerAPI.reportReview` PATCH; buttons in `ReportsInboxView` / detail flow. |
| Reject semantics | **Partial** | Backend migration history references `rejected` vs `reviewed`; iOS uses `approved`, `reviewed`, `changes_requested` in UI — align with API contract in implementation stage. |
| Pending attention | **Partial** | `HomeDashboardView` / ops surfaces; verify KPIs vs `ops/overview`. |

**Overall:** **Partial** — real manager loop in code; needs runtime hardening and alignment on reject/reviewed naming.

---

## Web / Admin (`apps/web`)

| Capability | Status | Notes |
|------------|--------|--------|
| Auth / tenant | **Done** | Next.js app, Supabase, tenant middleware (established patterns). |
| Worker contour (API) | **Done** | Routes under `app/api/v1/worker/report/*`, `media/*`, `sync/*` align with iOS `WorkerAPI`. |
| Manager reports / review | **Done** | e.g. `app/.../dashboard/reports/[id]/page.tsx` references statuses including `approved`, `changes_requested`, `rejected`. |
| AI analysis pipeline | **Partial** | Jobs / analysis status exist; full “evidence/risk” depth is product-dependent. |
| Operational smoke | **Partial** | `npm run smoke:prod`, `smoke:pilot`, pilot scripts at root — **no mobile builds in CI** (per PHASE6 inventory). |

**Overall:** **Partial** — backend and web dashboard are the reference for contracts; mobile Android must catch up; iOS must close documented gaps.

---

## Cross-cutting

| Topic | Status |
|-------|--------|
| Unified API contracts for contour | **Done** on paper (`/api/v1` worker + reports + media). |
| Android parity | **Missing** — blocking for mandated Android launch. |
| CI for iOS/Android | **Missing** — no workflows found for mobile builds in PHASE6 inventory. |
| Worker video + text comment (must-have list) | **Not closed** on iOS or backend as scoped in §4 of scope lock. |
