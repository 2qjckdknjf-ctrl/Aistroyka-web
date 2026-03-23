# Phase 6 — Mobile completion layer (inventory)

**Date:** 2026-03-23  
**Tracks:** [AISAA-14](/AISAA/issues/AISAA-14)  
**Parent:** [AISAA-1](/AISAA/issues/AISAA-1)  
**Depends on (runtime truth):** [AISAA-11](/AISAA/issues/AISAA-11) — tenant-scoped API health and RLS parity affect **all** mobile sessions that mirror web; see [PHASE3_REMEDIATION.md](./PHASE3_REMEDIATION.md).

## Purpose

Truthful map of **iOS** vs **Android** vs **`apps/web`**: app boundaries, shared layers, how configuration reaches the device, and which `/api/v1/*` surfaces each client actually calls.

---

## 1. Repository layout

| Layer | Path | Role |
|-------|------|------|
| iOS Manager | `ios/AiStroykaManager/AiStroykaManager.xcodeproj` | SwiftUI app; manager dashboards, tasks, reports, team, AI tab, notifications |
| iOS Worker | `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` | SwiftUI app; worker day flow, reports, media upload, offline sync queue |
| iOS Shared | `ios/Shared/` (local Swift package) | `APIClient`, `Config`, `AuthService` (Supabase password grant REST), DTOs for worker sync/upload |
| Android Manager | `android/AiStroykaManager/` | **Stub** — single centered `Text("AiStroyka Manager")` in `ManagerApp.kt` |
| Android Worker | `android/AiStroykaWorker/` | **Stub** — single centered `Text("AiStroyka Worker")` in `WorkerApp.kt` |
| Android shared | `android/shared/` | **Minimal** — only `Config.kt` with default API base string (no HTTP client, no DTOs) |

**Naming (B4):** Primary apps are **AiStroykaManager** and **AiStroykaWorker**; **WorkerLite** is not used as the product name in these trees.

---

## 2. Configuration and auth

### iOS

- **API base:** `Config.baseURL` from `Info.plist` keys `BASE_URL` (build setting `$(BASE_URL)`), env override, else `http://localhost:3000`. `apiBaseURL` = `{base}/api/v1`.
- **Supabase:** `SUPABASE_URL`, `SUPABASE_ANON_KEY` from plist / env; `AuthService` uses `POST {supabase}/auth/v1/token?grant_type=password` with `apikey` header.
- **Operator setup:** `ios/Config/Secrets.xcconfig` (gitignored) + `Secrets.xcconfig.example` — documented in repo `AGENTS.md`.

### Android

- **Default only:** `object Config { const val API_BASE_URL_DEFAULT = "https://api.aistroyka.ai" }` — **not wired** into UI or networking in stub apps.
- **Parity gap:** iOS plist/xcconfig pattern vs Android placeholder string with no OkHttp/Retrofit layer.

---

## 3. HTTP client behavior (iOS Shared)

`APIClient` (`ios/Shared/Sources/Shared/APIClient.swift`):

- Sends `x-device-id`, `x-client` (`ios_manager` vs `ios_lite` set at app bootstrap), optional `Authorization: Bearer`, optional `x-idempotency-key` on writes.
- JSON decode: `convertFromSnakeCase`.

---

## 4. API surface usage (repo truth)

### Worker (`WorkerAPI.swift`)

| Area | Paths (under `/api/v1/`) |
|------|---------------------------|
| Bootstrap | `config`, `projects` |
| Push | `devices/register` |
| Day / tasks | `worker/tasks/today`, `worker/day/start`, `worker/day/end` |
| Reports + media | `worker/report/create`, `add-media`, `submit`; `media/upload-sessions`, `.../finalize` |
| Sync | `sync/bootstrap`, `sync/changes` (409 conflict body), `sync/ack` |

Backend routes exist under `apps/web/app/api/v1/worker/*`, `sync/*`, `media/*` (aligned with Phase 3/7 narratives).

### Manager (`ManagerAPI.swift`)

| Area | Paths (representative) |
|------|-------------------------|
| Session / tenant | `me` |
| Core ops | `projects`, `projects/:id`, `projects/:id/summary`, `projects/:id/ai` |
| Tasks | `tasks`, `tasks/:id`, `tasks` POST, `tasks/:id/assign` |
| Reports | `reports`, `reports/:id` PATCH (review) |
| Roster / ops | `workers`, `ops/overview` |
| AI jobs | `ai/requests` |
| Devices / notifications | `devices`, `notifications`, `notifications/:id/read` |

### Web parity (explicit gaps on mobile)

Phase 5 web inventory ([PHASE5_PRODUCT_INVENTORY.md](./PHASE5_PRODUCT_INVENTORY.md)) lists **owner module**, **portfolio**, **project documents / issues / attention / timeline**, **billing**, **plan-fit** — **none** of these appear in iOS `ManagerAPI` / views in this audit. iOS Manager tracks **classic** manager loop (projects, tasks, reports inbox, workers, AI list, notifications) — not the newer web-only surfaces.

### Android

**No** `/api/v1` calls in Kotlin source beyond the unused constant.

---

## 5. CI / automation

`.github/workflows/` contains **no** iOS or Android build or test jobs (web deploy, migrations, pilot smoke, lockfile only).

---

## 6. Tests

- **iOS:** No `*Tests` targets or `XCTest` files located under `ios/`.
- **Android:** No `src/test` or `androidTest` Kotlin sources found.

---

## 7. Cross-phase references

| Phase | Artifact |
|-------|----------|
| 3 live / health | [PHASE3_LIVE_MATRIX.md](./PHASE3_LIVE_MATRIX.md), [PHASE3_REMEDIATION.md](./PHASE3_REMEDIATION.md) |
| 5 product (web) | [PHASE5_PRODUCT_INVENTORY.md](./PHASE5_PRODUCT_INVENTORY.md) |

---

## 8. Live vs repo scope

This inventory is **repo-first**. End-to-end mobile sessions against production are **not re-proven** here while [AISAA-11](/AISAA/issues/AISAA-11) is blocked; iOS would still hit the same tenant API and RLS behavior as web once authenticated.
