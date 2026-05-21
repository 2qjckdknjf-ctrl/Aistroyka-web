# iOS Worker — Phase 3 (MVP polish) completion report

**Date:** 2026-05-13  
**Scope:** AiStroykaWorker — localization of primary flows, report UX (preview, queue errors), resubmit when `changes_requested`, honest copy about server limits.

## What shipped

- **Home:** Pending queue / uploads / shift / tasks strings use `Localizable.strings` (en/ru/es/it). **Manager feedback** section lists reports in `changes_requested` from `GET /api/v1/worker/sync`, opens resubmit screen via `NavigationLink(value:)`.
- **Report create:** Localized labels, confirmation dialogs, navigation title, **56×56** thumbnails after pick, localized upload state labels, submit state messaging. **Submit failures** (including `proof_required` and `max_attempts`) surface localized copy from queue `lastErrorCode` / message.
- **Task detail & login:** Main strings localized (placeholders, CTA, title).
- **Report resubmit (`ReportResubmitView`):** Loads `GET /api/v1/reports/:id` (lite-allowed, own report only), shows `manager_note`, **Submit again** enqueues `submitReport` with `payload.reportId` and empty `dependsOn` (server `resubmit` path).
- **Operation queue:** `ExecuteResult.permanent` carries optional **API `code`**; failed ops persist `lastErrorCode` (e.g. `proof_required`). Max-retry sets `lastErrorCode = max_attempts` instead of a long English sentence.

## Validation

- `xcodebuild -scheme AiStroykaWorker -destination 'platform=iOS Simulator,name=iPhone 15,OS=17.2' -configuration Debug build` — **BUILD SUCCEEDED**.

## Known limits (honest, not faked)

- **Worker notes** are not in contracts/DB/worker API; the app does not pretend notes are submitted.
- **`changes_requested` + new photos:** `addMediaToReport` on the server only allows `draft`, so workers **cannot** attach replacement media while status is `changes_requested`. The resubmit screen explains that new proof requires a **new report** from home. (A future product decision could extend the backend.)
- **Local notifications** (`LocalReminderService`) remain English-only (out of this pass).
- **`navigationDestination(for: String.self)`** uses raw report UUIDs; if other `String`-valued destinations are added to the same stack, routing may need a dedicated `Hashable` wrapper type.

## Verdict

- **Phase 3 polish (this slice):** **YES** — Worker home/report/login/task flows are localized (four locales), errors are understandable, resubmit after manager feedback is wired to real APIs.
- **Overall “iOS Worker product-ready” (audit bar, XCTest, full string sweep):** **NO** — treat as incremental closure; follow `IOS_CURRENT_STATE_AUDIT.md` for remaining gates.
