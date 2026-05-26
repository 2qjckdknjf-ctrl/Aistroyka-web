# Offline / error hardening report

**Date:** 2026-05-19

## iOS Worker

- **Offline queue:** `OperationQueueStore` + `OperationQueueExecutor` + background upload hooks — strongest coverage in the monorepo.
- **HTTP errors:** 401 notification path; 409 sync conflict handling in `WorkerAPI.syncChanges`.
- **Not re-tested** here under airplane mode / slow network (manual **P0** follow-up).

## Android Worker

- **No** durable offline queue; failures surface in banner/pipeline text; user must retry manually.
- **Shift + photos** now require network for API + Supabase storage (same as iOS without queue).
- **401 handling hardened:** unauthorized responses now clear session and return to login (prevents stale app state after token expiry).
- **API error UX hardened:** common `403/404/409/5xx` and `lite_client_path_forbidden` now map to localized user-facing messages.

## Android / iOS Manager

- Standard error banners; Android Manager now also auto-resets to login on `401` and maps common API statuses to localized messages; no systematic torture test in this session.

## Verdict

**NOT COMPLETE** — construction-site matrix from the spec was not executed; Android Worker remains weaker than iOS for offline.
