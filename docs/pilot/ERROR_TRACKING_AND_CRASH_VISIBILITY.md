# Error Tracking and Crash Visibility

**Phase 6 — Pilot Deployment & Observability**

---

## Target surfaces

- **Backend:** Route failures and unhandled errors.
- **Web:** Fatal UI/API failures where practical (error boundary, critical API calls).
- **iOS:** Runtime/crash breadcrumbs where practical (no SDK yet).
- **Android:** Runtime/crash breadcrumbs where practical (no SDK yet).

---

## Backend

### Implemented

- **Abstraction:** `captureException(error, context)` in `@/lib/observability/error-tracking`.
- **Context (all optional):** `request_id`, `route`, `tenant_id`, `user_id`, `category`, `severity`, `code`.
- **Categories:** `auth`, `tenant_context`, `report_submit`, `upload`, `sync`, `task_assign`, `review_action`, `notification`, `api_5xx`, `api_4xx`, `unknown`.
- **Severity:** `fatal`, `error`, `warn`, `info`. Defaults by category in `SEVERITY_BY_CATEGORY`.
- **Output:** Structured log event `error_captured` with sanitized message (no tokens, truncated message). No external provider wired by default.

### Usage in routes

- In catch blocks or error paths, call `captureException(err, { request_id: getOrCreateRequestId(request), route: ROUTE_KEY, tenant_id: ctx?.tenantId, user_id: ctx?.userId, category: "report_submit" })`.
- Prefer existing `logStructured` for known business events (e.g. sync_conflict); use `captureException` for unexpected or unhandled errors.

### External provider (e.g. Sentry)

- **Not configured.** To add Sentry (or similar):
  1. Install SDK in apps/web (and optionally in mobile).
  2. In `captureException`, after `logStructured`, call `Sentry.captureException(error, { extra: context })`.
  3. Configure DSN via env (e.g. `SENTRY_DSN`); do not commit DSN.
  4. Set `environment`, `release` from build/env so pilot issues can be filtered.

---

## Web

- **Error boundary:** `app/error.tsx` shows request_id from URL in dev; no server-side reporting yet.
- **API errors:** AI panel and engine client surface request_id; no automatic capture to a service.
- **Next step:** Add optional Sentry (or similar) in `_app`/layout and in `captureException`; document exact env and init in this doc when done.

---

## iOS

- **Current:** No crash reporting or breadcrumb SDK.
- **Options:** Sentry iOS, Firebase Crashlytics, or Apple’s built-in crash reports (TestFlight/App Store).
- **Breadcrumbs:** When adding an SDK, log: app launch, login/logout, report submit, sync start/end, API errors (with request_id if available). Do not log tokens or full PII.
- **Setup path:** (1) Add SDK via SPM/CocoaPods. (2) Init in AppDelegate with DSN from config. (3) Set environment/release. (4) Add diagnostics screen field “Last error” that can copy request_id or error id to clipboard.

---

## Android

- **Current:** No app implementation in repo; no crash reporting.
- **When implementing:** Same pattern as iOS: choose provider (Sentry, Crashlytics), init with env/release, add breadcrumbs for key actions and API errors, no secrets in breadcrumbs.

---

## Correlation with request_id

- Backend: Always pass `request_id` into `captureException` when available (from `getOrCreateRequestId(request)`).
- Web/iOS/Android: When showing or sending an error to support, include the request_id from the failing response so backend logs can be searched.

---

## Implementation status

- **Done:** Backend `captureException`, categories, severity, structured log event, no secrets.
- **Documented:** Sentry/setup path for backend and web; iOS/Android breadcrumbs and setup path.
- **Pending:** Wire Sentry (or other) when approved; add client-side capture in web and mobile when SDK is added.
