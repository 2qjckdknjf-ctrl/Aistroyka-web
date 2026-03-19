# Step 16 — Centralized Observability Summary

## What observability capability is now real

- **Single diagnostics view:** GET /api/v1/admin/ops/diagnostics (admin, tenant-scoped) returns in one response: correlation (build_sha, build_time, app_env), ops_metrics (uploads_stuck, jobs_failed, ai_failed, etc.), ai_runtime (by_route, error_count, error_rate_window, recent_error_sample), job_failures (by_type, total, recent with last_error_preview), and operator_hints. Operators can answer "what is failing, where, which build" from one call.
- **Build/release correlation on all operator endpoints:** GET /api/v1/ops/metrics and GET /api/v1/ops/overview now include a `correlation` object (build_sha, build_time, app_env). GET /api/v1/admin/ops/ai-runtime already had it. No operator view is without release identity.
- **Canonical signal model:** Event categories, error categories, route/service/job dimensions, severity, and tenant-safe correlation fields are documented in STEP16_SIGNAL_MODEL.md. Same vocabulary for routes, jobs, AI, and admin.
- **Alertability foundation:** Alert-worthy event classes, severity thresholds model, and where signals come from (DB vs log) are documented in STEP16_ALERTABILITY_FOUNDATION.md. No in-repo alert transport; system is alert-ready.
- **Safety/hygiene:** STEP16_DATA_HYGIENE_REVIEW.md documents no secrets in logs, no prompts in audit, no PII in observability payloads, and tenant/admin safety. Existing logger sanitize and audit shape unchanged.

## What remains partial and why

- **Log-based aggregation:** Error rate or latency by route from request_finished/error_captured requires an external log pipeline or APM; not implemented in-app.
- **Alert transport:** No Slack/PagerDuty or webhook in repo; documented as explicit gap. Step 17 can add incident/alert delivery.
- **Tests:** New and updated tests (ops/metrics correlation, diagnostics route) were not run in this session due to Vitest/esbuild environment; they are in repo and should be run in CI.

## Next major step allowed

**Yes.** Step 16 is closed. The system has a real centralized observability layer: one diagnostics endpoint, correlation on all relevant operator responses, and clear documentation for signals, alertability, release correlation, and data hygiene. Proceeding to Step 17 (or next planned step) is allowed.

## Exact blockers (if any)

None. Optional: ensure NEXT_PUBLIC_BUILD_SHA and NEXT_PUBLIC_BUILD_TIME are set in CI so production builds expose meaningful correlation values.
