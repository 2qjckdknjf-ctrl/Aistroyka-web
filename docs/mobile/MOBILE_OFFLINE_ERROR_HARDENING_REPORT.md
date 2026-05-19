# Offline / error hardening report

**Date:** 2026-05-19

## iOS Worker

- **Offline queue:** `OperationQueueStore` + `OperationQueueExecutor` + background upload hooks — strongest coverage in the monorepo.
- **HTTP errors:** 401 notification path; 409 sync conflict handling in `WorkerAPI.syncChanges`.
- **Not re-tested** here under airplane mode / slow network (manual **P0** follow-up).

## Android Worker

- **No** durable offline queue; failures surface in banner/pipeline text; user must retry manually.
- **Shift + photos** now require network for API + Supabase storage (same as iOS without queue).

## Android / iOS Manager

- Standard error banners; no systematic torture test in this session.

## Verdict

**NOT COMPLETE** — construction-site matrix from the spec was not executed; Android Worker remains weaker than iOS for offline.
