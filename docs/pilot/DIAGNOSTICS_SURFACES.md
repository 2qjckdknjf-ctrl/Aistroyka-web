# Diagnostics Surfaces — Support / Field Debugging

**Phase 6 — Pilot Deployment & Observability**

---

## Goal

Field debugging without needing Xcode/Android Studio logs for every issue. Each app exposes a diagnostics area with version, environment, tenant/role where applicable, auth state, and last error or request_id when useful.

---

## iOS Manager

**Location:** More → Settings.

**Shown:**
- **Account:** Signed in / Not signed in; role failure message if unauthorized.
- **Environment:** API base URL; client profile (ios_manager).
- **Diagnostics:** App version, build number; tenant ID and role (loaded from GET /api/v1/me).

**Implementation:** `ManagerSettingsView` in AiStroyka Manager; `.task` loads `ManagerAPI.me()` for tenant_id and role.

---

## iOS Worker

**Location:** Home screen → **Support** button (toolbar) → sheet **Diagnostics**.

**Shown:**
- **App:** Version, build number.
- **Environment:** API base URL; client profile (ios_lite).
- **Device:** Device ID (x-device-id), selectable for copy.
- **Session:** Signed in / Not signed in.
- **Sync:** Sync status (idle, synced, syncing, needsBootstrap, offline, error); last error message if any (selectable).

**Implementation:** `DiagnosticsView` in AiStroyka Worker; opened via Support button on `HomeView`.

---

## Web

**Current:**
- **Error page:** `app/error.tsx` shows request_id from URL query `?request_id=` in dev for support correlation.
- **AI flows:** Request_id in AI panel (dev/staging) and Copy button; admin Request ID explorer at `/admin/ai/requests`.
- **Debug auth:** `/api/_debug/auth` returns hasCookies, userId, traceId (dev/debug only).

**Optional (documented):** A dedicated **Support / Diagnostics** page or section under settings could show: app/env indicator, tenant from session, last API error or request_id if stored in client state. Not implemented in Phase 6; can be added when needed.

---

## Android Worker / Manager

**Status:** No Android app in repo yet. When implemented:
- Add a **Diagnostics** or **Support** screen with: app version, build, API base URL, client profile, device id, auth state, last sync/error summary, request_id if captured from responses.

---

## Security

- No tokens, passwords, or full PII in diagnostics screens.
- Tenant ID and role are shown for support correlation only; device ID is necessary for sync/API correlation.
- Diagnostics are in-app only; not sent automatically to any server except as part of normal API calls (e.g. x-device-id, x-client).

---

## Request_id in diagnostics

- **Backend** returns `x-request-id` on instrumented routes; clients can capture it from response headers and show “Last request ID” in diagnostics when an error occurs.
- **iOS:** APIClient can be extended to read `x-request-id` from responses and store the last one (or last error request_id) for display in DiagnosticsView.
- **Web:** Already surfaces request_id in error page (URL param) and AI panel; no global “last request id” store yet.

---

## Implementation status

- **Done:** iOS Manager Settings diagnostics (version, build, API, client, tenant, role, auth). iOS Worker Diagnostics view (version, build, API, client, device id, session, sync status/last error); Support button on Home.
- **Documented:** Web current behavior; optional Support page; Android when implemented; request_id capture for future.
- **Pending:** Optional “last request_id” in iOS clients and web when desired.
