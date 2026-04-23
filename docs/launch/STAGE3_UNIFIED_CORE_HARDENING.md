# STAGE 3 — Unified core hardening (first-client contour)

**Scope:** Launch-critical contour only: Worker submit → Manager sees report → detail (media + AI signal) → approve / reject / request changes → consistent state. No new product modules, no STAGE 4, no customer module.

## Truth matrix (repo-backed contracts)

| Area | Backend / web | Android Worker | Android Manager | iOS Worker | iOS Manager |
|------|----------------|----------------|-----------------|------------|-------------|
| **x-client** | `lite-allow-list.ts`: only `ios_lite` / `android_lite` restricted; Manager routes need non-lite profile | `android_lite` via `AppRuntime.apiClientProfile` after init | `android_manager` in `ManagerApplication` | `ios_lite` set in `RootView` (matches `APIClient` default) | `ios_manager` in `ManagerRootView` |
| **PATCH review body** | `status` + optional `manager_note`; allowed: `approved`, `rejected`, `changes_requested` | Same strings in `ManagerViewModel.submitReview` | Same | N/A | Same (fixed: was invalid `reviewed`) |
| **Review gate** | Only from `submitted` (`updateReview` in `report.repository.ts`) | UI enables actions only when `status == submitted` | Same | N/A | Same |
| **Report list filter** | `GET /reports?status=submitted&...` | Submitted-only toggle | iOS inbox loads all by default (existing); optional filter out of scope | N/A | Same |
| **Media on detail** | Report rows: `media_id` / `upload_session_id`; previews via `GET projects/:id/media` (`file_url` keyed by media `id`) | Resolve `project_id` from list row or `tasks/:id`; map `media_id` → URL | Same pattern | N/A | Same pattern (added): task → project → project media |
| **AI visibility (launch path)** | `GET reports/:id/analysis-status` (flat JSON: `status`, `jobCount`, `summary`) | Loaded on Manager detail | Loaded on Manager detail (added section + refresh after review) | Lite allow-list permits this path for Worker if needed | Same endpoint on detail |
| **Worker report lifecycle** | create → upload session → finalize → add-media → submit (`draft` → `submitted`) | `WorkerApi` matches iOS Worker routes | N/A | Same | N/A |

## Mismatches found and fixed

1. **Android `x-client` vs Manager API**  
   Shared `ApiClient` used a fixed `android_lite` constant while `ManagerApplication` expected `AppRuntime.apiClientProfile` (property was missing). **Fix:** Added `AppRuntime.apiClientProfile` (default `android_lite`); `ApiClient` reads it; `WorkerApplication` sets `android_lite` explicitly; Manager already sets `android_manager`.

2. **iOS Manager sent invalid review status**  
   “Mark reviewed” called PATCH with `reviewed`, which the API rejects (`400`: only `approved`, `rejected`, `changes_requested`). **Fix:** Replaced with **Reject** → `rejected`; updated post-review state checks to use `rejected` instead of `reviewed`.

3. **iOS Manager detail vs Android (P0 parity)**  
   Android Manager already loaded `analysis-status` and project media for previews. iOS showed IDs only and no pipeline section. **Fix:** Added `ManagerAPI.reportAnalysisStatus` and `ManagerAPI.projectMedia`; detail loads task → project → media map + analysis block; `AsyncImage` when URL exists.

4. **Project media limit**  
   API caps `limit` (typically 50). **Fix:** Android `ManagerApi.projectMedia` coerces to 1–50; ViewModel uses `50` instead of `120`.

## Intentionally narrow (by design)

- **Worker resubmit after `changes_requested`:** Backend supports `resubmit`; dedicated Worker UI flow is not expanded in this stage (only Manager/Worker review semantics alignment).
- **iOS reports inbox** does not add “submitted only” toggle (Android has it); inbox still loads up to 100 reports—acceptable P1 unless pilot demands filter parity.
- **Web dashboard** not re-audited beyond existing routes; truth source remains `/api/v1/*` as implemented.

## Files touched (summary)

- `android/shared/.../AppRuntime.kt`, `ApiClient.kt`, `ManagerApi.kt`
- `android/AiStroykaWorker/.../WorkerApplication.kt`
- `android/AiStroykaManager/.../ManagerViewModel.kt`
- `ios/AiStroykaWorker/.../RootView.swift`
- `ios/AiStroykaManager/.../ManagerAPI.swift`, `ReportsInboxView.swift`
